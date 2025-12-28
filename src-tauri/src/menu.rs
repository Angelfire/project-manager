use std::process::Command as StdCommand;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    App, AppHandle,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

pub fn setup_menu(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    {
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

        app.on_menu_event(handle_menu_event);
    }

    Ok(())
}

fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "about" => {
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                show_about_dialog(&app_handle).await;
            });
        }
        "quit" => {
            app.exit(0);
        }
        _ => {}
    }
}

async fn show_about_dialog(app: &AppHandle) {
    let package_info = app.package_info();
    let version = package_info.version.to_string();
    let name = &package_info.name;

    let node_version = get_node_version().unwrap_or_else(|| "N/A".to_string());
    let rust_version = get_rust_version().unwrap_or_else(|| "N/A".to_string());

    let message = format!(
        "{}\nVersion {}\n\nDeveloped by Andrés Bedoya\nGitHub: https://github.com/Angelfire/\n\nTechnical Details:\n• Node.js: {}\n• Rust: {}\n• React: 19.1.0\n• Tailwind CSS: 4.1.18\n• TypeScript: 5.8.3\n• Tauri: 2",
        name, version, node_version, rust_version
    );

    let _ = app
        .dialog()
        .message(message)
        .title("About Project Manager")
        .kind(MessageDialogKind::Info)
        .blocking_show();
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
        .map(|s| s.trim().split_whitespace().nth(1).unwrap_or("").to_string())
}
