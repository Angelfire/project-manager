mod detection;
pub mod error;
mod menu;
mod port;
mod process;
mod process_logs;
mod project_info;
mod quick_actions;
mod types;
pub mod validation;

#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<types::Project>, error::AppError> {
    // Validate path before processing
    let validated_path = validation::validate_directory_path(&path)?;
    
    // Pass PathBuf directly to maintain type safety
    detection::scan_directory(&validated_path)
}

#[tauri::command]
fn kill_process_tree(pid: u32) -> Result<(), error::AppError> {
    // Validate PID before processing
    let validated_pid = validation::validate_pid(pid)?;
    
    process::kill_process_tree(validated_pid)
}

#[tauri::command]
fn detect_port_by_pid(pid: u32) -> Result<Option<u16>, error::AppError> {
    // Validate PID before processing
    let validated_pid = validation::validate_pid(pid)?;
    
    process::detect_port_by_pid(validated_pid)
}

#[tauri::command]
fn open_in_editor(path: String) -> Result<(), error::AppError> {
    // Validate path before processing
    let validated_path = validation::validate_file_path(&path)?;
    
    // Pass PathBuf directly to maintain type safety
    quick_actions::open_in_editor(&validated_path)
}

#[tauri::command]
fn open_in_terminal(path: String) -> Result<(), error::AppError> {
    // Validate path before processing
    let validated_path = validation::validate_file_path(&path)?;
    
    // Pass PathBuf directly to maintain type safety
    quick_actions::open_in_terminal(&validated_path)
}

#[tauri::command]
fn open_in_file_manager(path: String) -> Result<(), error::AppError> {
    // Validate path before processing
    let validated_path = validation::validate_file_path(&path)?;
    
    // Pass PathBuf directly to maintain type safety
    quick_actions::open_in_file_manager(&validated_path)
}

#[tauri::command]
fn validate_directory_path_command(path: String) -> Result<(), error::AppError> {
    // Validate that the path exists and is a directory
    validation::validate_directory_path(&path).map(|_| ())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            kill_process_tree,
            detect_port_by_pid,
            open_in_editor,
            open_in_terminal,
            open_in_file_manager,
            validate_directory_path_command,
            process_logs::spawn_process_with_logs
        ])
        .setup(|app| {
            menu::setup_menu(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
