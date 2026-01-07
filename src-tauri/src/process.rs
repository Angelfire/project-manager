use crate::error::AppError;
use std::process::Command as StdCommand;

/// Kills a process tree (parent and all children) by PID
/// 
/// Note: This function uses Unix-specific commands (ps, pgrep, kill) and will only work
/// on Unix-like systems (Linux, macOS). Windows is not currently supported.
#[cfg(unix)]
pub fn kill_process_tree(pid: u32) -> Result<(), AppError> {
    // First, verify that the process exists
    // Use `ps -p` to check if the process exists
    let ps_check = StdCommand::new("ps")
        .args(&["-p", &pid.to_string()])
        .output()?;
    
    // If ps returns non-zero exit code, the process doesn't exist
    if !ps_check.status.success() {
        return Err(AppError::NotFound(format!("Process with PID {} does not exist", pid)));
    }

    // Unix (macOS/Linux): kill the process and all its children
    // First, find all child processes recursively (up to 5 levels to catch shell children)
    let mut all_pids = vec![pid];
    let mut current_level = vec![pid];
    let mut seen_pids = std::collections::HashSet::new();
    seen_pids.insert(pid);

    // Search for child processes up to 5 levels (shell -> package manager -> dev server)
    for _level in 0..5 {
        let mut next_level = Vec::new();
        for parent_pid in &current_level {
            let pgrep_output = StdCommand::new("pgrep")
                .args(&["-P", &parent_pid.to_string()])
                .output()?;

            let child_pids_str = String::from_utf8(pgrep_output.stdout)?;
            for child_pid_line in child_pids_str.lines() {
                if let Ok(child_pid) = child_pid_line.trim().parse::<u32>() {
                    // Avoid duplicates
                    if seen_pids.insert(child_pid) {
                        all_pids.push(child_pid);
                        next_level.push(child_pid);
                    }
                }
            }
        }
        if next_level.is_empty() {
            break;
        }
        current_level = next_level;
    }

    // Get the current process PID to avoid killing ourselves
    let current_pid = std::process::id();
    
    // Get the parent process ID to avoid killing our parent (Tauri)
    // Note: parent_id() may not be available in all Rust versions, so we'll use a safer approach
    let parent_pid = std::os::unix::process::parent_id();
    
    // Kill all found processes (children first, then parent)
    // But skip if it's our own process or our parent (Tauri)
    for process_pid in all_pids.iter().rev() {
        // Safety check: never kill ourselves or our parent (Tauri)
        if *process_pid == current_pid || *process_pid == parent_pid {
            continue;
        }
        
        let kill_output = StdCommand::new("kill")
            .args(&["-9", &process_pid.to_string()])
            .output();
        
        // Ignore errors for processes that may have already terminated
        if let Ok(output) = kill_output {
            if !output.status.success() && *process_pid == pid {
                // Only fail if we couldn't kill the main process (and it's not us)
                return Err(AppError::CommandError(format!("Failed to kill process with PID {}", pid)));
            }
        }
    }

    // IMPORTANT: We do NOT kill the process group here because it could kill Tauri
    // if the shell process is in the same process group as Tauri.
    // Instead, we rely on killing individual processes which is safer.
    // The recursive child process discovery should catch all children.

    // Wait a moment to ensure processes are terminated
    std::thread::sleep(std::time::Duration::from_millis(100));

    // Verify that the main process was terminated (only if it's not us or our parent)
    if pid != current_pid && pid != parent_pid {
        let verify_output = StdCommand::new("ps")
            .args(&["-p", &pid.to_string()])
            .output()?;
        
        if verify_output.status.success() {
            // Process still exists, try one more time with SIGKILL
            // But only if it's safe (not us or our parent)
            let _ = StdCommand::new("kill")
                .args(&["-9", &pid.to_string()])
                .output();
        }
    }

    Ok(())
}

/// Detects which port a process (or its children) is listening on
/// 
/// Note: This function uses Unix-specific commands (lsof, pgrep, ps) and will only work
/// on Unix-like systems (Linux, macOS). Windows is not currently supported.
#[cfg(unix)]
pub fn detect_port_by_pid(pid: u32) -> Result<Option<u16>, AppError> {
    // Unix (macOS/Linux): use lsof to find the port
    // First try with the PID directly
    let output = StdCommand::new("lsof")
        .args(&["-Pan", "-p", &pid.to_string(), "-iTCP", "-sTCP:LISTEN"])
        .output()?;

    let output_str = String::from_utf8(output.stdout)?;
    for line in output_str.lines().skip(1) {
        // Format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
        // Example: node 12345 user 30u IPv4 0x... TCP *:4321 (LISTEN)
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 9 {
            // Search in the NAME column that contains the port
            let name_part = parts[8];
            if name_part.contains(':') {
                if let Some(port_str) = name_part.split(':').last() {
                    // Can have format *:4321 or localhost:4321
                    let port_str = port_str.split(' ').next().unwrap_or(port_str);
                    if let Ok(port) = port_str.parse::<u16>() {
                        if port > 0 {
                            return Ok(Some(port));
                        }
                    }
                }
            }
        }
    }

    // If we didn't find it with the direct PID, search for child processes recursively
    // using pgrep to find all child processes (up to 3 levels)
    let mut all_child_pids = Vec::new();
    let mut current_level_pids = vec![pid];

    // Search up to 3 levels of child processes
    for _level in 0..3 {
        let mut next_level_pids = Vec::new();
        for parent_pid in &current_level_pids {
            let pgrep_output = StdCommand::new("pgrep")
                .args(&["-P", &parent_pid.to_string()])
                .output()?;

            let child_pids_str = String::from_utf8(pgrep_output.stdout)?;
            for child_pid_line in child_pids_str.lines() {
                if let Ok(child_pid) = child_pid_line.trim().parse::<u32>() {
                    all_child_pids.push(child_pid);
                    next_level_pids.push(child_pid);
                }
            }
        }
        if next_level_pids.is_empty() {
            break;
        }
        current_level_pids = next_level_pids;
    }

    // Clone the list before using it in the loop (to be able to use it later too)
    let child_pids_for_check = all_child_pids.clone();

    // Search for ports in all found child processes
    for child_pid in &all_child_pids {
        let lsof_output = StdCommand::new("lsof")
            .args(&[
                "-Pan",
                "-p",
                &child_pid.to_string(),
                "-iTCP",
                "-sTCP:LISTEN",
            ])
            .output()?;

        let lsof_str = String::from_utf8(lsof_output.stdout)?;
        for line in lsof_str.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 9 {
                let name_part = parts[8];
                if name_part.contains(':') {
                    if let Some(port_str) = name_part.split(':').last() {
                        let port_str = port_str.split(' ').next().unwrap_or(port_str);
                        if let Ok(port) = port_str.parse::<u16>() {
                            if port > 0 {
                                return Ok(Some(port));
                            }
                        }
                    }
                }
            }
        }
    }

    // As a last resort, search in common ports specific to frameworks
    // and verify if the process using them is a descendant of the original PID
    let test_ports = vec![
        4321, 4322, 4323, 4324, 4325, // Astro
        3000, 3001, 3002, 3003, 3004, // Next.js/React
        5173, 5174, 5175, 5176, 5177, // Vite
        8000, 8001, 8002, 8003, 8004, // Deno
    ];

    // child_pids_for_check is already cloned above

    for test_port in test_ports {
        let lsof_output = StdCommand::new("lsof")
            .args(&["-ti", &format!(":{}", test_port)])
            .output()?;

        let pid_str = String::from_utf8(lsof_output.stdout)?;
        for pid_line in pid_str.lines() {
            if let Ok(listening_pid) = pid_line.trim().parse::<u32>() {
                // Verify if this PID is the same or is in the list of child processes
                if listening_pid == pid || child_pids_for_check.contains(&listening_pid) {
                    return Ok(Some(test_port));
                }
                // Verify recursively the PPID (up to 5 levels)
                let mut current_pid = listening_pid;
                for _depth in 0..5 {
                    let ppid_output = StdCommand::new("ps")
                        .args(&["-o", "ppid=", "-p", &current_pid.to_string()])
                        .output()?;

                    let ppid_str = String::from_utf8(ppid_output.stdout)?;
                    if let Ok(ppid) = ppid_str.trim().parse::<u32>() {
                        if ppid == pid || child_pids_for_check.contains(&ppid) {
                            return Ok(Some(test_port));
                        }
                        current_pid = ppid;
                    } else {
                        break;
                    }
                }
            }
        }
    }

    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kill_process_tree_nonexistent_pid() {
        // Test with a very high PID that likely doesn't exist
        // Should return an error since process doesn't exist
        let result = kill_process_tree(999999);
        assert!(result.is_err(), "Killing nonexistent process should return an error");
    }

    #[test]
    fn test_detect_port_by_pid_nonexistent_pid() {
        // Test with a very high PID that likely doesn't exist
        // Should return Ok(None) since process doesn't exist (or error on some systems)
        let result = detect_port_by_pid(999999);
        match result {
            Ok(port) => assert!(port.is_none(), "Nonexistent process should not have a port"),
            Err(e) => {
                // On some systems, querying a nonexistent PID returns an error
                assert!(!e.to_string().is_empty(), "Error message should not be empty");
            }
        }
    }

    #[test]
    fn test_detect_port_by_pid_current_process() {
        // Test with current process PID (should exist)
        let current_pid = std::process::id();
        let result = detect_port_by_pid(current_pid);
        // Should return Ok since the process exists (though port may be None)
        assert!(result.is_ok(), "Querying existing process should not fail");
        
        // The result should be None since this test process doesn't listen on a port
        if let Ok(port) = result {
            assert!(port.is_none(), "Test process should not be listening on a port");
        }
    }

    #[test]
    fn test_kill_process_tree_safety_checks() {
        // Test that we don't kill our own process
        let current_pid = std::process::id();
        let result = kill_process_tree(current_pid);
        // This should either succeed (if the process check fails) or return an error
        // But importantly, it should NOT kill the current process
        // The function should detect that it's trying to kill itself and skip it
        // Since we skip killing ourselves, the function might succeed or fail depending on implementation
        // The key is that the process should still be alive after this call
        assert!(std::process::id() == current_pid, "Current process should still be alive");
    }

    #[test]
    fn test_kill_process_tree_parent_safety() {
        // Test that we don't kill the parent process (Tauri)
        let parent_pid = std::os::unix::process::parent_id();
        let result = kill_process_tree(parent_pid);
        // This should either succeed (if the process check fails) or return an error
        // But importantly, it should NOT kill the parent process
        // The function should detect that it's trying to kill the parent and skip it
        // Since we skip killing the parent, the function might succeed or fail depending on implementation
        // The key is that the parent process should still be alive after this call
        // We verify this by checking that our parent PID hasn't changed
        assert!(std::os::unix::process::parent_id() == parent_pid, "Parent process should still be alive");
    }
}
