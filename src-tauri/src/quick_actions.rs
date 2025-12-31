use crate::error::AppError;
use std::path::Path;
use std::process::Command as StdCommand;

/// Open the given file or directory in a text editor.
///
/// This function first tries to launch Visual Studio Code (`code` or
/// `code-insiders`). If neither is available, it falls back to the system
/// default editor:
/// - On macOS, it uses `open -a TextEdit`.
/// - On Linux, it uses `xdg-open`.
///
/// The path is converted to a UTF-8 string only for passing to the
/// underlying system commands.
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
        // Escape the path for AppleScript by replacing special characters
        // This provides defense-in-depth protection alongside AppleScript's quoted form
        let escaped_path = path_str
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("'", "\\'");
        
        // Embed the path directly in the script to avoid osascript argv splitting issues
        // with paths containing spaces. Use AppleScript's quoted form for additional safety.
        let script = format!(
            "tell application \"Terminal\"\n\
             do script \"cd \" & quoted form of \"{}\"\n\
             activate\n\
             end tell",
            escaped_path
        );
        
        StdCommand::new("osascript")
            .arg("-e")
            .arg(&script)
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
                    "bash",
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
