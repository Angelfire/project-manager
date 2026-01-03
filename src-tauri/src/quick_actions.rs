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
/// # Path Encoding
///
/// The path is converted to a string using `to_string_lossy()` for passing to
/// underlying system commands. This conversion may lose information for paths
/// containing invalid UTF-8 sequences (replacing them with the Unicode
/// replacement character U+FFFD).
///
/// On Unix systems, paths are not required to be valid UTF-8. As a result:
/// - Opening files or directories whose names contain invalid UTF-8 may fail,
///   or the wrong path may be opened, because the editor receives a lossy,
///   modified version of the original path.
/// - These failures may appear "silent" from the perspective of this helper,
///   since it only checks whether the command starts, not that the intended
///   file was successfully opened.
///
/// This is a known limitation of `open_in_editor`. If your application must
/// robustly support arbitrary byte sequences in paths (common on Unix),
/// consider:
/// - Using `OsStr` / `Path`-based APIs throughout and avoiding conversion to
///   UTF-8 when launching editors, or
/// - Explicitly requiring that all paths be valid UTF-8 and documenting that
///   constraint for callers of this function.
pub fn open_in_editor(path: &Path) -> Result<(), AppError> {
    // Convert to String only when needed for system commands
    // Note: to_string_lossy() may lose information for non-UTF-8 paths
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

/// Open the given directory in a terminal emulator.
///
/// # Platform-specific behavior
///
/// - **macOS**: Opens Terminal.app with the directory as the working directory
/// - **Linux**: Tries multiple terminal emulators (gnome-terminal, konsole, xterm, alacritty)
///
/// # Path Encoding
///
/// The path is converted to a string using `to_string_lossy()` for passing to
/// underlying system commands. This conversion may lose information for paths
/// containing invalid UTF-8 sequences (replacing them with the Unicode
/// replacement character U+FFFD). On Unix systems, paths are not required to be
/// valid UTF-8, so this is a known limitation.
pub fn open_in_terminal(path: &Path) -> Result<(), AppError> {
    // Convert to String only when needed for system commands
    // Note: to_string_lossy() may lose information for non-UTF-8 paths
    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        // macOS: open Terminal.app with the path
        // Pass the path as a command-line argument to osascript for proper handling.
        // AppleScript's quoted form properly escapes all special characters when applied
        // to the variable, avoiding command injection risks.
        let script = "on run argv\n\
                     set posixPath to item 1 of argv\n\
                     tell application \"Terminal\"\n\
                     do script \"cd \" & quoted form of posixPath\n\
                     activate\n\
                     end tell\n\
                     end run";
        
        StdCommand::new("osascript")
            .arg("-e")
            .arg(script)
            .arg(&path_str)
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

/// Open the given file or directory in the system file manager.
///
/// # Platform-specific behavior
///
/// - **macOS**: Uses the `open` command to open in Finder
/// - **Linux**: Tries multiple file managers (nautilus, dolphin, thunar, pcmanfm, xdg-open)
///
/// # Path Encoding
///
/// The path is converted to a string using `to_string_lossy()` for passing to
/// underlying system commands. This conversion may lose information for paths
/// containing invalid UTF-8 sequences (replacing them with the Unicode
/// replacement character U+FFFD). On Unix systems, paths are not required to be
/// valid UTF-8, so this is a known limitation.
pub fn open_in_file_manager(path: &Path) -> Result<(), AppError> {
    // Convert to String only when needed for system commands
    // Note: to_string_lossy() may lose information for non-UTF-8 paths
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_temp_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp directory")
    }

    fn create_temp_file(dir: &std::path::Path, name: &str, content: &str) -> std::path::PathBuf {
        let file_path = dir.join(name);
        fs::write(&file_path, content).expect("Failed to write temp file");
        file_path
    }

    #[test]
    fn test_open_in_editor_nonexistent_path() {
        // Test that function handles nonexistent paths gracefully
        let path = std::path::Path::new("/nonexistent/path/12345");
        // Function may succeed or fail, but should not panic
        let _ = open_in_editor(path);
    }

    #[test]
    fn test_open_in_editor_existing_file() {
        let temp_dir = create_temp_dir();
        let file_path = create_temp_file(temp_dir.path(), "test.txt", "content");

        // Function may succeed or fail depending on available editors, but should not panic
        let _ = open_in_editor(&file_path);
    }

    #[test]
    fn test_open_in_editor_existing_directory() {
        let temp_dir = create_temp_dir();

        // Function may succeed or fail depending on available editors, but should not panic
        let _ = open_in_editor(temp_dir.path());
    }

    #[test]
    fn test_open_in_terminal_nonexistent_path() {
        // Test that function handles nonexistent paths gracefully
        let path = std::path::Path::new("/nonexistent/path/12345");
        // Function may succeed or fail, but should not panic
        let _ = open_in_terminal(path);
    }

    #[test]
    fn test_open_in_terminal_existing_directory() {
        let temp_dir = create_temp_dir();

        // Function may succeed or fail depending on available terminals, but should not panic
        let _ = open_in_terminal(temp_dir.path());
    }

    #[test]
    fn test_open_in_file_manager_nonexistent_path() {
        // Test that function handles nonexistent paths gracefully
        let path = std::path::Path::new("/nonexistent/path/12345");
        // Function may succeed or fail, but should not panic
        let _ = open_in_file_manager(path);
    }

    #[test]
    fn test_open_in_file_manager_existing_directory() {
        let temp_dir = create_temp_dir();

        // Function may succeed or fail depending on available file managers, but should not panic
        let _ = open_in_file_manager(temp_dir.path());
    }

    #[test]
    fn test_open_in_file_manager_existing_file() {
        let temp_dir = create_temp_dir();
        let file_path = create_temp_file(temp_dir.path(), "test.txt", "content");

        // Function may succeed or fail depending on available file managers, but should not panic
        let _ = open_in_file_manager(&file_path);
    }
}
