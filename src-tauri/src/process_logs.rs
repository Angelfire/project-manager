use std::io::{BufRead, BufReader};
use std::process::{Command as StdCommand, Stdio};
use std::env;
use tauri::{AppHandle, Emitter};

/// Escapes a string for safe use in single-quoted shell context
/// 
/// This function properly escapes single quotes by ending the quoted string,
/// adding an escaped single quote, and starting a new quoted string.
/// This is the POSIX-compliant way to include single quotes in single-quoted strings.
/// 
/// Example: "it's" becomes "'it'\"'\"'s'"
fn escape_shell_single_quote(s: &str) -> String {
    // In single quotes, the only character that needs escaping is the single quote itself
    // The pattern is: end quote, add escaped quote (\'), start new quote
    s.replace('\'', "'\"'\"'")
}

/// Escapes and quotes a string for safe use in shell command
/// 
/// Wraps the string in single quotes after escaping any single quotes within it.
/// Single quotes in shell prevent all interpretation of special characters,
/// making this safer than double quotes or unquoted strings.
fn shell_quote(s: &str) -> String {
    format!("'{}'", escape_shell_single_quote(s))
}

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
                    // Prefer the user's configured fish shell path from $SHELL,
                    // but still try common Homebrew locations as fallbacks.
                    shells.push((user_shell.clone(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
                    if user_shell != "/usr/local/bin/fish" {
                        shells.push(("/usr/local/bin/fish".to_string(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
                    }
                    if user_shell != "/opt/homebrew/bin/fish" {
                        shells.push(("/opt/homebrew/bin/fish".to_string(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
                    }
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
    // SECURITY: Validate command and arguments before processing
    // This prevents command injection by ensuring only whitelisted commands
    // and safe arguments are used.
    crate::validation::validate_command(&command)
        .map_err(|e| format!("Command validation failed: {}", e))?;
    crate::validation::validate_command_args(&args)
        .map_err(|e| format!("Argument validation failed: {}", e))?;
    
    let validated_path = crate::validation::validate_directory_path(&cwd)
        .map_err(|e| e.to_string())?;
    
    // Convert PathBuf to String for shell command construction (only once)
    let validated_path_str = validated_path.to_string_lossy();
    
    // Build the command string to execute through a login shell
    // SECURITY NOTE: We use a shell because we need to source shell config files
    // to load environment variables from version managers (FNM, NVM, Volta, asdf).
    // This is a necessary trade-off, but we mitigate risks by:
    // 1. Validating commands against a whitelist
    // 2. Validating arguments for dangerous characters
    // 3. Properly escaping all user-controlled data with single quotes
    // 4. Using single quotes which prevent shell interpretation of special characters
    
    // Escape and quote each argument using robust escaping
    let args_str: String = args
        .iter()
        .map(|arg| shell_quote(arg))
        .collect::<Vec<_>>()
        .join(" ");
    
    // Get list of shells to try (user's shell first, then fallbacks)
    let shells = get_shells_to_try();
    
    // Track the preferred shell (first in list) to detect fallback usage
    let preferred_shell = shells.first().map(|(path, _)| path.clone());
    
    // Build the command to execute (cd to directory and run the command)
    // SECURITY: All user-controlled data (path, command, args) is properly quoted
    // Single quotes prevent shell interpretation, and we've validated inputs above
    let quoted_path = shell_quote(&validated_path_str);
    let quoted_command = shell_quote(&command);
    let command_part = format!("cd {} && {} {}", quoted_path, quoted_command, args_str);
    
    // Try each shell until one works
    // We source shell config files to ensure all version managers (FNM, NVM, Volta, asdf) are loaded
    let mut child = None;
    let mut last_error = None;
    let mut used_shell = None;
    let mut preferred_shell_failed = false;
    
    for (index, (shell_path, source_command)) in shells.iter().enumerate() {
        // Construct full shell command: source config + execute command
        let shell_command = format!("{}; {}", source_command, command_part);
        
        // Determine shell flags based on shell type
        // Extract shell name from path to avoid substring matching issues (e.g., "fish" contains "sh")
        let shell_name = shell_path.split('/').last().unwrap_or(shell_path);
        let shell_flags = if shell_name == "fish" {
            // Fish doesn't support -l (login), use -c instead
            vec!["-c"]
        } else if shell_name == "sh" {
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
                used_shell = Some(shell_path.clone());
                // If we're not using the first shell (preferred), mark that preferred failed
                if index > 0 {
                    preferred_shell_failed = true;
                }
                break;
            }
            Err(e) => {
                last_error = Some(format!("Failed to spawn with {}: {}", shell_path, e));
                // If this is the preferred shell, mark it as failed
                if index == 0 {
                    preferred_shell_failed = true;
                }
                continue;
            }
        }
    }
    
    let mut child = child.ok_or_else(|| {
        last_error.unwrap_or_else(|| format!("Failed to spawn process '{}': No suitable shell found", command))
    })?;
    
    // Notify user if preferred shell failed and a fallback was used
    if preferred_shell_failed {
        let preferred = preferred_shell.as_deref().unwrap_or("unknown");
        let used = used_shell.as_deref().unwrap_or("unknown");
        let warning_message = format!(
            "Warning: Preferred shell '{}' failed to spawn. Using fallback shell '{}'. This may result in different PATH settings, aliases, or environment variables.",
            preferred, used
        );
        
        // Emit warning event to frontend
        let _ = app.emit(
            "process-shell-fallback",
            serde_json::json!({
                "projectPath": project_path.clone(),
                "preferredShell": preferred,
                "usedShell": used,
                "message": warning_message
            }),
        );
        
        // Also log to stderr so it appears in the project logs
        let app_clone = app.clone();
        let project_path_clone = project_path.clone();
        std::thread::spawn(move || {
            let _ = app_clone.emit(
                "process-stderr",
                serde_json::json!({
                    "projectPath": project_path_clone,
                    "content": format!("[WARNING] {}", warning_message)
                }),
            );
        });
    }

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
