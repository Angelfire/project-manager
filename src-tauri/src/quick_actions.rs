use crate::error::AppError;
use std::path::Path;
use std::process::Command as StdCommand;

/// Escapes a string for safe use in AppleScript string literals.
///
/// This function is security-critical as it prevents command injection vulnerabilities
/// when constructing AppleScript commands with user-provided or file system data.
///
/// # Characters Escaped
///
/// - `\` (backslash) → `\\` - Prevents escape sequence interpretation
/// - `"` (double quote) → `\"` - Prevents breaking out of string literals
/// - `\n` (newline) → `\\n` - Prevents multi-line injection
/// - `\r` (carriage return) → `\\r` - Prevents line break injection
/// - `\t` (tab) → `\\t` - Prevents tab character issues in commands
///
/// # Security Rationale
///
/// AppleScript string literals use double quotes and backslash escaping. Without proper
/// escaping, malicious file paths or user input could:
/// - Break out of the string literal context using unescaped quotes
/// - Inject arbitrary AppleScript commands
/// - Execute unintended system operations
///
/// # Examples
///
/// ```rust
/// # fn escape_applescript_string(s: &str) -> String {
/// #     s.chars()
/// #         .map(|c| match c {
/// #             '\\' => "\\\\".to_string(),
/// #             '"' => "\\\"".to_string(),
/// #             '\n' => "\\n".to_string(),
/// #             '\r' => "\\r".to_string(),
/// #             '\t' => "\\t".to_string(),
/// #             _ => c.to_string(),
/// #         })
/// #         .collect()
/// # }
/// // Safe handling of quotes in file paths
/// assert_eq!(escape_applescript_string(r#"file"name.txt"#), r#"file\"name.txt"#);
///
/// // Prevents backslash-based escape sequence injection
/// assert_eq!(escape_applescript_string(r"C:\path\to\file"), r"C:\\path\\to\\file");
///
/// // Handles newlines that could break command structure
/// assert_eq!(escape_applescript_string("line1\nline2"), "line1\\nline2");
///
/// // Edge case: multiple special characters combined
/// assert_eq!(
///     escape_applescript_string("path\\with\"quotes\nand\ttabs"),
///     "path\\\\with\\\"quotes\\nand\\ttabs"
/// );
/// ```
///
/// # Note
///
/// This function works in conjunction with AppleScript's `quoted form of` command
/// (used in `open_in_terminal`) to provide defense-in-depth protection.

pub fn open_in_editor(path: &Path) -> Result<(), AppError> {
    // Convert to String only when needed for system commands
    let path_str = path.to_string_lossy().to_string();

    // Try VS Code first, then fallback to system default
    let commands = vec![
        ("code", vec![path_str.clone()]),
        ("code-insiders", vec![path_str.clone()]),
    ];

    for (cmd, args) in commands {
        if let Ok(mut child) = StdCommand::new(cmd).args(&args).spawn() {
            let _ = child.wait();
            return Ok(());
        }
    }

    // Fallback: try to open with system default editor
    #[cfg(target_os = "macos")]
    {
        StdCommand::new("open")
            .args(&["-a", "TextEdit", &path_str])
            .output()?;
    }

    #[cfg(target_os = "linux")]
    {
        StdCommand::new("xdg-open").arg(&path_str).output()?;
    }

    Ok(())
}

pub fn open_in_terminal(path: &Path) -> Result<(), AppError> {
    // Convert to String only when needed for system commands
    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        // macOS: open Terminal.app with the path
        // Use AppleScript's POSIX file syntax to properly handle all special characters
        // Pass the path as a command-line argument to osascript for proper escaping
        let script = format!(
            "on run argv\n\
             set posixPath to item 1 of argv\n\
             tell application \"Terminal\"\n\
             do script \"cd \" & quoted form of posixPath\n\
             activate\n\
             end tell\n\
             end run"
        );
        StdCommand::new("osascript")
            .args(&["-e", &script, &path_str])
            .output()?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try different terminal emulators
        let terminals = vec![
            ("gnome-terminal", vec!["--working-directory", &path_str]),
            ("konsole", vec!["--workdir", &path_str]),
            (
                "xterm",
                vec![
                    "-e",
                    "bash",
                    "-c",
                    "cd \"$1\" && exec bash",
                    "--",
                    &path_str,
                ],
            ),
            ("alacritty", vec!["--working-directory", &path_str]),
        ];

        for (cmd, args) in terminals {
            if StdCommand::new(cmd).args(&args).spawn().is_ok() {
                return Ok(());
            }
        }
    }

    Ok(())
}

pub fn open_in_file_manager(path: &Path) -> Result<(), AppError> {
    // Convert to String only when needed for system commands
    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        StdCommand::new("open")
            .arg(&path_str)
            .output()
            .map_err(|e| {
                AppError::CommandError(format!("Failed to open in file manager: {}", e))
            })?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try different file managers
        let managers = vec![
            ("nautilus", vec![&path_str]),
            ("dolphin", vec![&path_str]),
            ("thunar", vec![&path_str]),
            ("pcmanfm", vec![&path_str]),
            ("xdg-open", vec![&path_str]),
        ];

        for (cmd, args) in managers {
            if StdCommand::new(cmd).args(&args).spawn().is_ok() {
                return Ok(());
            }
        }
    }

    Ok(())
}
