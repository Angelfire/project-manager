use crate::error::AppError;
use std::process::Command as StdCommand;

pub fn open_in_editor(path: String) -> Result<(), AppError> {
    // Try VS Code first, then fallback to system default
    let commands = vec![
        ("code", vec![path.clone()]),
        ("code-insiders", vec![path.clone()]),
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
            .args(&["-a", "TextEdit", &path])
            .output()?;
    }

    #[cfg(target_os = "linux")]
    {
        StdCommand::new("xdg-open").arg(&path).output()?;
    }

    Ok(())
}

pub fn open_in_terminal(path: String) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        // macOS: open Terminal.app with the path
        let script = format!(
            "tell application \"Terminal\"\n\
             do script \"cd '{}'\"\n\
             activate\n\
             end tell",
            path.replace("'", "'\"'\"'")
        );
        StdCommand::new("osascript")
            .args(&["-e", &script])
            .output()?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try different terminal emulators
        let terminals = vec![
            ("gnome-terminal", vec!["--working-directory", &path]),
            ("konsole", vec!["--workdir", &path]),
            (
                "xterm",
                vec!["-e", "bash", "-c", &format!("cd '{}' && exec bash", path)],
            ),
            ("alacritty", vec!["--working-directory", &path]),
        ];

        for (cmd, args) in terminals {
            if StdCommand::new(cmd).args(&args).spawn().is_ok() {
                return Ok(());
            }
        }
    }

    Ok(())
}

pub fn open_in_finder(path: String) -> Result<(), AppError> {
    #[cfg(target_os = "macos")]
    {
        StdCommand::new("open")
            .arg(&path)
            .output()
            .map_err(|e| AppError::CommandError(format!("Failed to open in Finder: {}", e)))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try different file managers
        let managers = vec![
            ("nautilus", vec![&path]),
            ("dolphin", vec![&path]),
            ("thunar", vec![&path]),
            ("pcmanfm", vec![&path]),
            ("xdg-open", vec![&path]),
        ];

        for (cmd, args) in managers {
            if StdCommand::new(cmd).args(&args).spawn().is_ok() {
                return Ok(());
            }
        }
    }

    Ok(())
}
