use std::io::{BufRead, BufReader};
use std::process::{Command as StdCommand, Stdio};
use std::env;
use tauri::{AppHandle, Emitter};

/// Detects the user's preferred shell and returns a list of shells to try
/// Priority: 1) User's $SHELL, 2) Platform defaults, 3) Common alternatives
fn get_shells_to_try() -> Vec<(String, String)> {
    let mut shells = Vec::new();
    
    // First, try to get the user's shell from $SHELL environment variable
    if let Ok(user_shell) = env::var("SHELL") {
        // Extract shell name from path (e.g., "/bin/zsh" -> "zsh")
        if let Some(shell_name) = user_shell.split('/').last() {
            match shell_name {
                "zsh" => {
                    shells.push(("/bin/zsh".to_string(), "source ~/.zshrc 2>/dev/null || source ~/.zprofile 2>/dev/null || true".to_string()));
                }
                "bash" => {
                    shells.push(("/bin/bash".to_string(), "source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || true".to_string()));
                }
                "fish" => {
                    shells.push(("/usr/local/bin/fish".to_string(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
                    shells.push(("/opt/homebrew/bin/fish".to_string(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
                }
                "csh" => {
                    shells.push(("/bin/csh".to_string(), "source ~/.cshrc 2>/dev/null || true".to_string()));
                }
                "tcsh" => {
                    shells.push(("/bin/tcsh".to_string(), "source ~/.tcshrc 2>/dev/null || source ~/.cshrc 2>/dev/null || true".to_string()));
                }
                "ksh" => {
                    shells.push(("/bin/ksh".to_string(), "source ~/.kshrc 2>/dev/null || source ~/.profile 2>/dev/null || true".to_string()));
                }
                _ => {
                    // Unknown shell, try to use it as-is
                    shells.push((user_shell.clone(), "true".to_string()));
                }
            }
        }
    }
    
    // Platform-specific defaults (only if user shell wasn't found or is different)
    #[cfg(target_os = "macos")]
    {
        // macOS default is zsh, but also try bash
        if !shells.iter().any(|(path, _)| path.contains("zsh")) {
            shells.push(("/bin/zsh".to_string(), "source ~/.zshrc 2>/dev/null || source ~/.zprofile 2>/dev/null || true".to_string()));
        }
        if !shells.iter().any(|(path, _)| path.contains("bash")) {
            shells.push(("/bin/bash".to_string(), "source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || true".to_string()));
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        // Linux default is usually bash
        if !shells.iter().any(|(path, _)| path.contains("bash")) {
            shells.push(("/bin/bash".to_string(), "source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || true".to_string()));
        }
        if !shells.iter().any(|(path, _)| path.contains("zsh")) {
            shells.push(("/bin/zsh".to_string(), "source ~/.zshrc 2>/dev/null || source ~/.zprofile 2>/dev/null || true".to_string()));
        }
    }
    
    // Common alternatives (fish, sh as last resort)
    if !shells.iter().any(|(path, _)| path.contains("fish")) {
        shells.push(("/usr/local/bin/fish".to_string(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
        shells.push(("/opt/homebrew/bin/fish".to_string(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
    }
    
    // Last resort: sh (POSIX shell, minimal config)
    shells.push(("/bin/sh".to_string(), "true".to_string()));
    
    shells
}

/// Spawns a process and streams its stdout/stderr to the frontend via events
/// 
/// Note: Once spawned, the child process handle is moved into background threads
/// and cannot be accessed or killed through this function's return value. The process
/// must be managed through the PID returned by this function using external tools
/// or the kill_process_tree function.
#[tauri::command]
pub async fn spawn_process_with_logs(
    app: AppHandle,
    command: String,
    args: Vec<String>,
    cwd: String,
    project_path: String,
) -> Result<u32, String> {
    let validated_path = crate::validation::validate_directory_path(&cwd)
        .map_err(|e| e.to_string())?;
    
    // Convert PathBuf to String for shell command construction (only once)
    let validated_path_str = validated_path.to_string_lossy();
    
    // Build the command string to execute through a login shell
    // This ensures all environment variables (FNM, NVM, Volta, asdf, etc.) are available
    let args_str: String = args
        .iter()
        .map(|arg| {
            // Escape single quotes in arguments
            arg.replace('\'', "'\"'\"'")
        })
        .collect::<Vec<_>>()
        .join(" ");
    
    // Get list of shells to try (user's shell first, then fallbacks)
    let shells = get_shells_to_try();
    
    // Build the command to execute (cd to directory and run the command)
    // Escape path and command only once
    let escaped_path = validated_path_str.replace('\'', "'\"'\"'");
    let escaped_command = command.replace('\'', "'\"'\"'");
    let command_part = format!("cd {} && {} {}", escaped_path, escaped_command, args_str);
    
    // Try each shell until one works
    // We source shell config files to ensure all version managers (FNM, NVM, Volta, asdf) are loaded
    let mut child = None;
    let mut last_error = None;
    
    for (shell_path, source_command) in shells.iter() {
        // Construct full shell command: source config + execute command
        let shell_command = format!("{}; {}", source_command, command_part);
        
        // Determine shell flags based on shell type
        let shell_flags = if shell_path.contains("fish") {
            // Fish doesn't support -l (login), use -c instead
            vec!["-c"]
        } else if shell_path.contains("sh") && !shell_path.contains("bash") && !shell_path.contains("zsh") {
            // POSIX sh doesn't support -l, use -c
            vec!["-c"]
        } else {
            // zsh, bash, csh, tcsh, ksh support -l (login shell)
            vec!["-l", "-c"]
        };
        
        match StdCommand::new(shell_path)
            .args(&shell_flags)
            .arg(&shell_command)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(c) => {
                child = Some(c);
                break;
            }
            Err(e) => {
                last_error = Some(format!("Failed to spawn with {}: {}", shell_path, e));
                continue;
            }
        }
    }
    
    let mut child = child.ok_or_else(|| {
        last_error.unwrap_or_else(|| format!("Failed to spawn process '{}': No suitable shell found", command))
    })?;

    let pid = child.id();

    // Handle stdout
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        let project_path_clone = project_path.clone();
        let reader = BufReader::new(stdout);

        std::thread::Builder::new()
            .name(format!("process-stdout-{}", pid))
            .spawn(move || {
                for line in reader.lines() {
                    match line {
                        Ok(line) => {
                            // If emit fails, it means the app is shutting down, so exit the thread
                            if app_clone.emit(
                                "process-stdout",
                                serde_json::json!({
                                    "projectPath": project_path_clone.clone(),
                                    "content": line
                                }),
                            ).is_err() {
                                break;
                            }
                        }
                        Err(_) => break, // Pipe closed or error, exit thread
                    }
                }
            })
            .expect("Failed to spawn stdout reader thread");
    }

    // Handle stderr
    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        let project_path_clone = project_path.clone();
        let reader = BufReader::new(stderr);

        std::thread::Builder::new()
            .name(format!("process-stderr-{}", pid))
            .spawn(move || {
                for line in reader.lines() {
                    match line {
                        Ok(line) => {
                            // If emit fails, it means the app is shutting down, so exit the thread
                            if app_clone.emit(
                                "process-stderr",
                                serde_json::json!({
                                    "projectPath": project_path_clone.clone(),
                                    "content": line
                                }),
                            ).is_err() {
                                break;
                            }
                        }
                        Err(_) => break, // Pipe closed or error, exit thread
                    }
                }
            })
            .expect("Failed to spawn stderr reader thread");
    }

    // Handle process exit
    let app_clone = app.clone();
    let project_path_clone = project_path.clone();
    std::thread::Builder::new()
        .name(format!("process-wait-{}", pid))
        .spawn(move || {
            match child.wait() {
                Ok(_status) => {
                    // Emit exit event, ignore errors if app is shutting down
                    let _ = app_clone.emit(
                        "process-exit",
                        serde_json::json!({
                            "projectPath": project_path_clone,
                            "pid": pid
                        }),
                    );
                }
                Err(e) => {
                    // Emit error event, ignore errors if app is shutting down
                    let _ = app_clone.emit(
                        "process-exit-error",
                        serde_json::json!({
                            "projectPath": project_path_clone,
                            "pid": pid,
                            "error": e.to_string()
                        }),
                    );
                }
            }
        })
        .expect("Failed to spawn process wait thread");

    Ok(pid)
}
