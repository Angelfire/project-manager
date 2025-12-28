mod detection;
mod port;
mod process;
mod project_info;
mod quick_actions;
mod types;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use std::process::Command as StdCommand;

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

#[tauri::command]
fn open_in_editor(path: String) -> Result<(), String> {
    quick_actions::open_in_editor(path)
}

#[tauri::command]
fn open_in_terminal(path: String) -> Result<(), String> {
    quick_actions::open_in_terminal(path)
}

#[tauri::command]
fn open_in_finder(path: String) -> Result<(), String> {
    quick_actions::open_in_finder(path)
}

fn get_node_version() -> Option<String> {
    StdCommand::new("node")
        .arg("--version")
        .output()
        .ok()
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .map(|s| s.trim().to_string())
}

fn get_rust_version() -> Option<String> {
    StdCommand::new("rustc")
        .arg("--version")
        .output()
        .ok()
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .map(|s| {
            s.trim()
                .split_whitespace()
                .nth(1)
                .unwrap_or("")
                .to_string()
        })
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
            open_in_finder
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                // Create macOS menu bar
                let app_menu = Submenu::with_items(
                    app,
                    "Project Manager",
                    true,
                    &[
                        &MenuItem::with_id(app, "about", "About Project Manager", true, None::<&str>)?,
                        &PredefinedMenuItem::separator(app)?,
                        &PredefinedMenuItem::hide(app, Some("Hide Project Manager"))?,
                        &PredefinedMenuItem::hide_others(app, Some("Hide Others"))?,
                        &PredefinedMenuItem::show_all(app, Some("Show All"))?,
                        &PredefinedMenuItem::separator(app)?,
                        &MenuItem::with_id(
                            app,
                            "quit",
                            "Quit Project Manager",
                            true,
                            Some("CmdOrCtrl+Q"),
                        )?,
                    ],
                )?;

                let menu = Menu::with_items(app, &[&app_menu])?;
                app.set_menu(menu)?;

                // Handle menu events
                app.on_menu_event(move |app, event| match event.id().as_ref() {
                    "about" => {
                        let app_handle = app.clone();
                        tauri::async_runtime::spawn(async move {
                            let package_info = app_handle.package_info();
                            let version = package_info.version.to_string();
                            let name = &package_info.name;

                            // Get technical information
                            let node_version = get_node_version().unwrap_or_else(|| "N/A".to_string());
                            let rust_version = get_rust_version().unwrap_or_else(|| "N/A".to_string());
                            
                            let message = format!(
                                "{}\nVersion {}\n\nDeveloped by Andrés Bedoya\nGitHub: https://github.com/Angelfire/\n\nTechnical Details:\n• Node.js: {}\n• Rust: {}\n• React: 19.1.0\n• Tailwind CSS: 4.1.18\n• TypeScript: 5.8.3\n• Tauri: 2",
                                name,
                                version,
                                node_version,
                                rust_version
                            );
                            
                            let _ = app_handle
                                .dialog()
                                .message(message)
                                .title("About Project Manager")
                                .kind(MessageDialogKind::Info)
                                .blocking_show();
                        });
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
