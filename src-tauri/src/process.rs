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
    // First, find all child processes recursively
    // Process tree structure: shell -> package manager -> dev server -> watchers/compilers
    // We search up to 4 levels to cover: shell (0) -> pkg manager (1) -> dev server (2) -> children (3)
    // The 4th level covers edge cases where dev servers spawn additional processes
    let mut all_pids = vec![pid];
    let mut current_level = vec![pid];
    let mut seen_pids = std::collections::HashSet::new();
    seen_pids.insert(pid);

    // Search for child processes up to 4 levels
    // Optimize: batch pgrep calls when possible
    for _level in 0..4 {
        if current_level.is_empty() {
            break;
        }
        
        // Batch process: collect all PIDs to query in one go if possible
        // For now, we still need individual pgrep calls, but we can optimize the parsing
        let mut next_level = Vec::new();
        for parent_pid in &current_level {
            let pgrep_output = StdCommand::new("pgrep")
                .args(&["-P", &parent_pid.to_string()])
                .output()?;

            // Use iterator chain for more efficient parsing
            let child_pids: Vec<u32> = String::from_utf8(pgrep_output.stdout)?
                .lines()
                .filter_map(|line| line.trim().parse::<u32>().ok())
                .filter(|&child_pid| seen_pids.insert(child_pid))
                .collect();
            
            for child_pid in child_pids {
                all_pids.push(child_pid);
                next_level.push(child_pid);
            }
        }
        
        if next_level.is_empty() {
            break;
        }
        current_level = next_level;
    }

    // Get the current process PID to avoid killing ourselves
    let current_pid = std::process::id();
    
    // Get all ancestor PIDs (parent, grandparent, etc.) to avoid killing any Tauri process
    // This is critical because the process tree might include ancestor processes
    let mut ancestor_pids = std::collections::HashSet::new();
    let mut current_ancestor = std::os::unix::process::parent_id();
    
    // Traverse up the process tree to collect all ancestors (up to init/pid 1)
    // This ensures we don't kill any process in Tauri's process tree
    while current_ancestor > 1 {
        ancestor_pids.insert(current_ancestor);
        
        // Get the parent of the current ancestor
        let ppid_output = StdCommand::new("ps")
            .args(&["-o", "ppid=", "-p", &current_ancestor.to_string()])
            .output()
            .ok()
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .and_then(|ppid_str| ppid_str.trim().parse::<u32>().ok());
        
        match ppid_output {
            Some(ppid) if ppid != current_ancestor && ppid != 0 => {
                // Valid parent PID, continue traversing
                current_ancestor = ppid;
            }
            _ => {
                // Invalid parent, same as current, or 0 (init) - stop traversing
                break;
            }
        }
    }
    
    // Kill all found processes (children first, then parent)
    // But skip if it's our own process or any ancestor (Tauri process tree)
    for process_pid in all_pids.iter().rev() {
        // Safety check: never kill ourselves or any ancestor process (Tauri)
        if *process_pid == current_pid || ancestor_pids.contains(process_pid) {
            continue;
        }
        
        let kill_output = StdCommand::new("kill")
            .args(&["-9", &process_pid.to_string()])
            .output();
        
        // Ignore errors for processes that may have already terminated
        // Only fail if we couldn't kill the main process (and it's not us)
        if let Ok(output) = kill_output {
            if !output.status.success() && *process_pid == pid {
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

    // Verify that the main process was terminated
    // IMPORTANT: Only verify if the target PID is not our own process or any ancestor
    // This check is consistent with the safety check in the kill loop above (line 93)
    // If pid == current_pid or pid is an ancestor, we already skipped killing it,
    // so we should also skip verification to maintain consistent behavior
    if pid != current_pid && !ancestor_pids.contains(&pid) {
        let verify_output = StdCommand::new("ps")
            .args(&["-p", &pid.to_string()])
            .output()?;
        
        if verify_output.status.success() {
            // Process still exists, try one more time with SIGKILL
            // Safety: This is safe because we already verified pid != current_pid 
            // and pid is not in ancestor_pids above
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
    // Optimize: use HashSet to avoid duplicates and improve lookup performance
    let mut all_child_pids = std::collections::HashSet::new();
    let mut current_level_pids = vec![pid];

    // Search up to 3 levels of child processes
    for _level in 0..3 {
        if current_level_pids.is_empty() {
            break;
        }
        
        let mut next_level_pids = Vec::new();
        for parent_pid in &current_level_pids {
            let pgrep_output = StdCommand::new("pgrep")
                .args(&["-P", &parent_pid.to_string()])
                .output()?;

            // Use iterator chain for more efficient parsing
            let child_pids: Vec<u32> = String::from_utf8(pgrep_output.stdout)?
                .lines()
                .filter_map(|line| line.trim().parse::<u32>().ok())
                .filter(|&child_pid| all_child_pids.insert(child_pid))
                .collect();
            
            next_level_pids.extend(child_pids);
        }
        
        if next_level_pids.is_empty() {
            break;
        }
        current_level_pids = next_level_pids;
    }

    // Convert to Vec for iteration (HashSet already ensures uniqueness)
    let child_pids_for_check: Vec<u32> = all_child_pids.iter().copied().collect();

    // Search for ports in all found child processes
    // Optimize: use iterator chain for better performance
    for child_pid in &child_pids_for_check {
        let lsof_output = StdCommand::new("lsof")
            .args(&[
                "-Pan",
                "-p",
                &child_pid.to_string(),
                "-iTCP",
                "-sTCP:LISTEN",
            ])
            .output()?;

        // Use iterator chain for more efficient parsing
        let port = String::from_utf8(lsof_output.stdout)?
            .lines()
            .skip(1)
            .find_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() < 9 {
                    return None;
                }
                
                parts[8]
                    .split(':')
                    .last()
                    .and_then(|port_str| port_str.split(' ').next())
                    .and_then(|port_str| port_str.parse::<u16>().ok())
                    .filter(|&port| port > 0)
            });
        
        if let Some(port) = port {
            return Ok(Some(port));
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

    // Optimize: create HashSet once before the loop to avoid redundant allocations
    // Use HashSet for O(1) lookup instead of Vec.contains() which is O(n)
    let child_pids_set: std::collections::HashSet<u32> = child_pids_for_check.iter().copied().collect();

    for test_port in test_ports {
        let lsof_output = StdCommand::new("lsof")
            .args(&["-ti", &format!(":{}", test_port)])
            .output()?;

        let pid_str = String::from_utf8(lsof_output.stdout)?;
        for pid_line in pid_str.lines() {
            if let Ok(listening_pid) = pid_line.trim().parse::<u32>() {
                // Verify if this PID is the same or is in the list of child processes
                if listening_pid == pid || child_pids_set.contains(&listening_pid) {
                    return Ok(Some(test_port));
                }
                // Verify recursively the PPID (up to 5 levels)
                let mut current_pid = listening_pid;
                for _depth in 0..5 {
                    let ppid_output = StdCommand::new("ps")
                        .args(&["-o", "ppid=", "-p", &current_pid.to_string()])
                        .output()?;

                    let ppid = match String::from_utf8(ppid_output.stdout)
                        .ok()
                        .and_then(|s| s.trim().parse::<u32>().ok())
                    {
                        Some(ppid) => ppid,
                        None => break,
                    };
                    
                    if ppid == pid || child_pids_set.contains(&ppid) {
                        return Ok(Some(test_port));
                    }
                    current_pid = ppid;
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
        // The function should detect that we're trying to kill ourselves and skip it
        let current_pid = std::process::id();
        
        // Verify the process exists (should pass)
        let ps_check = StdCommand::new("ps")
            .args(&["-p", &current_pid.to_string()])
            .output()
            .expect("Failed to check if current process exists");
        assert!(ps_check.status.success(), "Current process should exist");
        
        // Call kill_process_tree on ourselves
        // The function should skip killing the current_pid when it finds it in the process tree
        let result = kill_process_tree(current_pid);
        
        // The function should either:
        // 1. Return Ok(()) if it successfully skipped all processes (including ourselves)
        // 2. Return an error if it couldn't verify the process (unlikely for current PID)
        // But importantly, it should NOT have killed the current process
        // We verify this by checking the process still exists and has the same PID
        assert!(std::process::id() == current_pid, "Current process should still be alive");
        
        // Verify the process still exists after the call
        let ps_check_after = StdCommand::new("ps")
            .args(&["-p", &current_pid.to_string()])
            .output()
            .expect("Failed to check if current process still exists");
        assert!(ps_check_after.status.success(), "Current process should still exist after kill attempt");
        
        // The result doesn't matter as much as the fact that we're still alive
        // But we log it for debugging
        if let Err(e) = result {
            // It's okay if it returns an error, as long as we didn't kill ourselves
            eprintln!("kill_process_tree returned error (expected): {}", e);
        }
    }

    #[test]
    fn test_kill_process_tree_parent_safety() {
        // Test that we don't kill the parent process (Tauri)
        // The function should detect that we're trying to kill our parent and skip it
        let parent_pid = std::os::unix::process::parent_id();
        
        // Verify the parent process exists (should pass)
        let ps_check = StdCommand::new("ps")
            .args(&["-p", &parent_pid.to_string()])
            .output()
            .expect("Failed to check if parent process exists");
        assert!(ps_check.status.success(), "Parent process should exist");
        
        // Call kill_process_tree on our parent
        // The function should skip killing the parent_pid when it finds it in the process tree
        let result = kill_process_tree(parent_pid);
        
        // The function should either:
        // 1. Return Ok(()) if it successfully skipped all processes (including parent)
        // 2. Return an error if it couldn't verify the process
        // But importantly, it should NOT have killed the parent process
        // We verify this by checking the parent PID hasn't changed
        let new_parent_pid = std::os::unix::process::parent_id();
        assert_eq!(
            new_parent_pid,
            parent_pid,
            "Parent process should still be alive and unchanged"
        );
        
        // Verify the parent process still exists after the call
        let ps_check_after = StdCommand::new("ps")
            .args(&["-p", &parent_pid.to_string()])
            .output()
            .expect("Failed to check if parent process still exists");
        assert!(ps_check_after.status.success(), "Parent process should still exist after kill attempt");
        
        // The result doesn't matter as much as the fact that the parent is still alive
        // But we log it for debugging
        if let Err(e) = result {
            // It's okay if it returns an error, as long as we didn't kill the parent
            eprintln!("kill_process_tree returned error (expected): {}", e);
        }
    }
}
