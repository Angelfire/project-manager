mod detection;
mod error;
mod menu;
mod port;
mod process;
mod project_info;
mod quick_actions;
mod types;
mod validation;

#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<types::Project>, String> {
    // Validate path before processing
    let validated_path = validation::validate_directory_path(&path)
        .map_err(|e| e.to_string())?;
    
    detection::scan_directory(validated_path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn kill_process_tree(pid: u32) -> Result<(), String> {
    // Validate PID before processing
    let validated_pid = validation::validate_pid(pid)
        .map_err(|e| e.to_string())?;
    
    process::kill_process_tree(validated_pid).map_err(|e| e.to_string())
}

#[tauri::command]
fn detect_port_by_pid(pid: u32) -> Result<Option<u16>, String> {
    // Validate PID before processing
    let validated_pid = validation::validate_pid(pid)
        .map_err(|e| e.to_string())?;
    
    process::detect_port_by_pid(validated_pid).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_in_editor(path: String) -> Result<(), String> {
    // Validate path before processing
    let validated_path = validation::validate_file_path(&path)
        .map_err(|e| e.to_string())?;
    
    quick_actions::open_in_editor(validated_path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_in_terminal(path: String) -> Result<(), String> {
    // Validate path before processing
    let validated_path = validation::validate_file_path(&path)
        .map_err(|e| e.to_string())?;
    
    quick_actions::open_in_terminal(validated_path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_in_file_manager(path: String) -> Result<(), String> {
    // Validate path before processing
    let validated_path = validation::validate_file_path(&path)
        .map_err(|e| e.to_string())?;
    
    quick_actions::open_in_file_manager(validated_path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
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
            open_in_file_manager
        ])
        .setup(|app| {
            menu::setup_menu(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
