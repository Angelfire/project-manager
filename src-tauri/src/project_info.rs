use crate::types::Project;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command as StdCommand;

pub fn get_runtime_version(runtime: &str, _path: &PathBuf) -> Option<String> {
    match runtime {
        "Node.js" => {
            // Try to get Node.js version
            if let Ok(output) = StdCommand::new("node").arg("--version").output() {
                if let Ok(version) = String::from_utf8(output.stdout) {
                    return Some(version.trim().to_string());
                }
            }
        }
        "Deno" => {
            // Try to get Deno version
            if let Ok(output) = StdCommand::new("deno").args(&["--version"]).output() {
                if let Ok(version_str) = String::from_utf8(output.stdout) {
                    // Deno version output format: "deno 1.x.x"
                    if let Some(line) = version_str.lines().next() {
                        if let Some(version) = line.split_whitespace().nth(1) {
                            return Some(version.to_string());
                        }
                    }
                }
            }
        }
        "Bun" => {
            // Try to get Bun version
            if let Ok(output) = StdCommand::new("bun").args(&["--version"]).output() {
                if let Ok(version) = String::from_utf8(output.stdout) {
                    return Some(version.trim().to_string());
                }
            }
        }
        _ => {}
    }
    None
}

pub fn get_package_json_scripts(path: &PathBuf) -> Option<HashMap<String, String>> {
    let package_json_path = path.join("package.json");
    if !package_json_path.exists() {
        return None;
    }

    if let Ok(content) = fs::read_to_string(&package_json_path) {
        if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(scripts) = json_value.get("scripts").and_then(|s| s.as_object()) {
                let mut scripts_map = HashMap::new();
                for (key, value) in scripts {
                    if let Some(script_value) = value.as_str() {
                        scripts_map.insert(key.clone(), script_value.to_string());
                    }
                }
                return Some(scripts_map);
            }
        }
    }
    None
}

pub fn get_directory_size(path: &PathBuf) -> Option<u64> {
    let mut total_size = 0u64;
    
    fn calculate_size(path: &PathBuf, total: &mut u64) {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let entry_path = entry.path();
                    if entry_path.is_dir() {
                        // Skip node_modules and other large directories to speed up
                        let dir_name = entry_path.file_name().and_then(|n| n.to_str());
                        if let Some(name) = dir_name {
                            if name == "node_modules" || name == ".git" || name == "dist" || name == "build" {
                                continue;
                            }
                        }
                        calculate_size(&entry_path, total);
                    } else if let Ok(metadata) = entry_path.metadata() {
                        *total += metadata.len();
                    }
                }
            }
        }
    }
    
    calculate_size(path, &mut total_size);
    Some(total_size)
}

pub fn get_modified_time(path: &PathBuf) -> Option<i64> {
    if let Ok(metadata) = fs::metadata(path) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
                return Some(duration.as_secs() as i64);
            }
        }
    }
    None
}

pub fn enrich_project_info(mut project: Project) -> Project {
    let path = PathBuf::from(&project.path);
    
    // Get runtime version
    project.runtime_version = get_runtime_version(&project.runtime, &path);
    
    // Get scripts from package.json (only for Node.js/Bun projects)
    if project.runtime == "Node.js" || project.runtime == "Bun" {
        project.scripts = get_package_json_scripts(&path);
    }
    
    // Get directory size
    project.size = get_directory_size(&path);
    
    // Get modified time
    project.modified = get_modified_time(&path);
    
    project
}

