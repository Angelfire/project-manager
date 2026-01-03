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
        });
    }

    // Handle stderr
    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        let project_path_clone = project_path.clone();
        let reader = BufReader::new(stderr);

        std::thread::spawn(move || {
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
        });
    }

    // Handle process exit
    let app_clone = app.clone();
    let project_path_clone = project_path.clone();
    std::thread::spawn(move || {
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
    });

    Ok(pid)
}
