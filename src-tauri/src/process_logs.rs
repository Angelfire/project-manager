use std::io::{BufRead, BufReader};
use std::process::{Command as StdCommand, Stdio};
use std::env;
use tauri::{AppHandle, Emitter};

/// Escapes a string for safe use in single-quoted shell context
/// 
/// This function properly escapes single quotes using the POSIX-compliant method:
/// When a single quote is encountered inside a single-quoted string, we:
/// 1. End the current quoted string with a single quote: '
/// 2. Add an escaped single quote in double quotes: "'"
/// 3. Start a new quoted string with a single quote: '
/// 
/// This results in the pattern: '...'\''...' which the shell interprets as:
/// - A single-quoted string ending at the first '
/// - An escaped single quote "'" (the ' is literal)
/// - A new single-quoted string starting at the second '
/// 
/// Example: "it's" becomes "it'\"'\"'s" which, when wrapped in quotes, becomes "'it'\"'\"'s'"
/// In shell: 'it'\''s' is interpreted as the string "it's"
fn escape_shell_single_quote(s: &str) -> String {
    // Replace each single quote with: ' (end quote) + "'" (escaped quote) + ' (start quote)
    // The pattern "'\"'\"'" means: ' + "'" + '
    // When this is inside a single-quoted string, it correctly escapes the quote
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
        // Extract shell name from path (e.g., "/bin/zsh" -> "zsh" or "/opt/homebrew/bin/zsh" -> "zsh")
        if let Some(shell_name) = user_shell.split('/').last() {
            match shell_name {
                "zsh" => {
                    // Use the user's actual zsh path (could be /bin/zsh, /opt/homebrew/bin/zsh, etc.)
                    shells.push((user_shell.clone(), "source ~/.zshrc 2>/dev/null || source ~/.zprofile 2>/dev/null || true".to_string()));
                }
                "bash" => {
                    // Use the user's actual bash path (could be /bin/bash, /usr/local/bin/bash, etc.)
                    shells.push((user_shell.clone(), "source ~/.bashrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || true".to_string()));
                }
                "fish" => {
                    // Use the user's configured fish shell path from $SHELL
                    shells.push((user_shell.clone(), "source ~/.config/fish/config.fish 2>/dev/null || true".to_string()));
                }
                "csh" => {
                    // Use the user's actual csh path
                    shells.push((user_shell.clone(), "source ~/.cshrc 2>/dev/null || true".to_string()));
                }
                "tcsh" => {
                    // Use the user's actual tcsh path
                    shells.push((user_shell.clone(), "source ~/.tcshrc 2>/dev/null || source ~/.cshrc 2>/dev/null || true".to_string()));
                }
                "ksh" => {
                    // Use the user's actual ksh path
                    shells.push((user_shell.clone(), "source ~/.kshrc 2>/dev/null || source ~/.profile 2>/dev/null || true".to_string()));
                }
                _ => {
                    // Unknown shell, try to use it as-is with the user's configured path
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_shell_single_quote_no_quotes() {
        // String without single quotes should remain unchanged
        assert_eq!(escape_shell_single_quote("hello"), "hello");
        assert_eq!(escape_shell_single_quote("path/to/file"), "path/to/file");
        assert_eq!(escape_shell_single_quote("npm"), "npm");
    }

    #[test]
    fn test_escape_shell_single_quote_single_quote() {
        // Single quote should be escaped
        let result = escape_shell_single_quote("it's");
        assert_eq!(result, "it'\"'\"'s");
        
        // Verify the pattern: 'it' + "'" + 's'
        // This should be: it'\"'\"'s
        assert!(result.contains("'\"'\"'"), "Should contain escaped quote pattern");
    }

    #[test]
    fn test_escape_shell_single_quote_multiple_quotes() {
        // Multiple single quotes should all be escaped
        let result = escape_shell_single_quote("don't won't can't");
        // Each ' becomes '\''
        assert_eq!(result, "don'\"'\"'t won'\"'\"'t can'\"'\"'t");
    }

    #[test]
    fn test_escape_shell_single_quote_only_quotes() {
        // String with only quotes
        let result = escape_shell_single_quote("'''");
        assert_eq!(result, "'\"'\"''\"'\"''\"'\"'");
    }

    #[test]
    fn test_escape_shell_single_quote_empty_string() {
        // Empty string should remain empty
        assert_eq!(escape_shell_single_quote(""), "");
    }

    #[test]
    fn test_escape_shell_single_quote_quote_at_start() {
        // Quote at the start
        let result = escape_shell_single_quote("'hello");
        assert_eq!(result, "'\"'\"'hello");
    }

    #[test]
    fn test_escape_shell_single_quote_quote_at_end() {
        // Quote at the end
        let result = escape_shell_single_quote("hello'");
        assert_eq!(result, "hello'\"'\"'");
    }

    #[test]
    fn test_shell_quote_no_quotes() {
        // String without quotes should be wrapped in single quotes
        assert_eq!(shell_quote("hello"), "'hello'");
        assert_eq!(shell_quote("path/to/file"), "'path/to/file'");
    }

    #[test]
    fn test_shell_quote_with_quotes() {
        // String with quotes should be escaped and wrapped
        let result = shell_quote("it's");
        assert_eq!(result, "'it'\"'\"'s'");
        
        // Verify it starts and ends with single quotes
        assert!(result.starts_with('\''), "Should start with single quote");
        assert!(result.ends_with('\''), "Should end with single quote");
    }

    #[test]
    fn test_shell_quote_complex_path() {
        // Test with a path that might have special characters
        let result = shell_quote("/path/to/project's files");
        assert_eq!(result, "'/path/to/project'\"'\"'s files'");
    }

    #[test]
    fn test_shell_quote_empty_string() {
        // Empty string should be wrapped in quotes
        assert_eq!(shell_quote(""), "''");
    }

    #[test]
    fn test_shell_quote_special_characters() {
        // Test that special characters (other than single quotes) are preserved
        // Single quotes prevent shell interpretation, so these should be safe
        let result = shell_quote("path with spaces & symbols");
        assert_eq!(result, "'path with spaces & symbols'");
        
        // Verify special characters are preserved
        assert!(result.contains(" "), "Spaces should be preserved");
        assert!(result.contains("&"), "Ampersand should be preserved");
    }

    #[test]
    fn test_shell_quote_unicode() {
        // Test with unicode characters
        let result = shell_quote("café");
        assert_eq!(result, "'café'");
    }

    #[test]
    fn test_shell_quote_command_injection_attempt() {
        // Test that command injection attempts are neutralized
        // Single quotes prevent shell interpretation
        let result = shell_quote("; rm -rf /");
        assert_eq!(result, "'; rm -rf /'");
        
        // The semicolon should be inside quotes, making it literal
        assert!(result.starts_with('\''), "Should start with quote");
        assert!(result.ends_with('\''), "Should end with quote");
    }
}
