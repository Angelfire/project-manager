use crate::types::Project;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command as StdCommand;
use std::sync::OnceLock;

// Cache runtime versions to avoid repeated command executions
static RUNTIME_VERSION_CACHE: OnceLock<std::sync::Mutex<HashMap<String, Option<String>>>> = OnceLock::new();

fn get_runtime_version_cache() -> &'static std::sync::Mutex<HashMap<String, Option<String>>> {
    RUNTIME_VERSION_CACHE.get_or_init(|| std::sync::Mutex::new(HashMap::new()))
}

pub fn get_runtime_version(runtime: &str, _path: &PathBuf) -> Option<String> {
    // Check cache first
    let cache = get_runtime_version_cache();
    if let Ok(cache_guard) = cache.lock() {
        if let Some(cached_version) = cache_guard.get(runtime) {
            return cached_version.clone();
        }
    }
    
    let version = match runtime {
        "Node.js" => {
            // Try to get Node.js version
            StdCommand::new("node")
                .arg("--version")
                .output()
                .ok()
                .and_then(|output| String::from_utf8(output.stdout).ok())
                .map(|v| v.trim().to_string())
        }
        "Deno" => {
            // Try to get Deno version
            StdCommand::new("deno")
                .args(&["--version"])
                .output()
                .ok()
                .and_then(|output| String::from_utf8(output.stdout).ok())
                .and_then(|version_str| {
                    version_str
                        .lines()
                        .next()
                        .and_then(|line| line.split_whitespace().nth(1))
                        .map(|v| v.to_string())
                })
        }
        "Bun" => {
            // Try to get Bun version
            StdCommand::new("bun")
                .args(&["--version"])
                .output()
                .ok()
                .and_then(|output| String::from_utf8(output.stdout).ok())
                .map(|v| v.trim().to_string())
        }
        _ => None,
    };
    
    // Cache the result
    if let Ok(mut cache_guard) = cache.lock() {
        cache_guard.insert(runtime.to_string(), version.clone());
    }
    
    version
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
    
    // Directories to skip (common large directories that don't need to be counted)
    let skip_dirs: &[&str] = &["node_modules", ".git", "dist", "build", ".next", ".turbo", ".cache"];
    
    fn calculate_size(path: &PathBuf, total: &mut u64, skip_dirs: &[&str]) {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                
                // Use metadata() which is faster than separate is_dir() + metadata() calls
                if let Ok(metadata) = entry_path.metadata() {
                    if metadata.is_dir() {
                        // Skip large directories to speed up calculation
                        if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                            if skip_dirs.contains(&name) {
                                continue;
                            }
                        }
                        calculate_size(&entry_path, total, skip_dirs);
                    } else {
                        *total += metadata.len();
                    }
                }
            }
        }
    }
    
    calculate_size(path, &mut total_size, skip_dirs);
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

