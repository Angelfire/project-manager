mod detection;
mod port;
mod process;
mod types;

#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<types::Project>, String> {
    detection::scan_directory(path)
}

#[tauri::command]
fn kill_process_tree(pid: u32) -> Result<(), String> {
    process::kill_process_tree(pid)
}

#[tauri::command]
fn detect_port_by_pid(pid: u32) -> Result<Option<u16>, String> {
    process::detect_port_by_pid(pid)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            kill_process_tree,
            detect_port_by_pid
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
