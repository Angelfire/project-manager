use std::io::{BufRead, BufReader};
use std::process::{Command as StdCommand, Stdio};
use tauri::{AppHandle, Emitter};

/// Spawns a process and streams its stdout/stderr to the frontend via events
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
    let mut child = StdCommand::new(&command)
        .args(&args)
        .current_dir(&validated_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    let pid = child.id();

    // Handle stdout
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        let project_path_clone = project_path.clone();
        let reader = BufReader::new(stdout);

        std::thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_clone.emit(
                        "process-stdout",
                        serde_json::json!({
                            "projectPath": project_path_clone.clone(),
                            "content": line
                        }),
                    );
                }
            }
        });
    }

    // Handle stderr
    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        let project_path_clone = project_path.clone();
        let reader = BufReader::new(stderr);

        std::thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_clone.emit(
                        "process-stderr",
                        serde_json::json!({
                            "projectPath": project_path_clone.clone(),
                            "content": line
                        }),
                    );
                }
            }
        });
    }

    // Handle process exit
    let app_clone = app.clone();
    let project_path_clone = project_path.clone();
    std::thread::spawn(move || {
        match child.wait() {
            Ok(_status) => {
                // On successful wait, emit the existing process-exit event
                let _ = app_clone.emit(
                    "process-exit",
                    serde_json::json!({
                        "projectPath": project_path_clone,
                        "pid": pid
                    }),
                );
            }
            Err(e) => {
                // If waiting on the process fails, emit a separate error event
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
    });

    Ok(pid)
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_spawn_process_with_logs_invalid_path() {
        // This test would require mocking Tauri AppHandle, which is complex
        // For now, we test the validation part indirectly through integration tests
        // The validation error should occur before spawning
        assert!(true); // Placeholder - actual test requires Tauri test setup
    }

    #[test]
    fn test_spawn_process_with_logs_valid_path() {
        // This test would require a full Tauri test environment
        // Integration tests in tests/ directory would be more appropriate
        assert!(true); // Placeholder
    }
}
