use crate::error::AppError;
use crate::project_info::enrich_project_info;
use crate::types::Project;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

/// Helper function to check if a file exists in a HashSet of file names
fn has_file(files: &HashSet<String>, name: &str) -> bool {
    files.contains(name)
}

/// Builds a HashSet of file names in a directory for efficient lookups
/// Uses iterator chains for better performance
fn get_directory_files(path: &PathBuf) -> HashSet<String> {
    fs::read_dir(path)
        .ok()
        .map(|entries| {
            entries
                .filter_map(|entry| entry.ok())
                .filter_map(|entry| entry.file_name().to_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default()
}

/// Detects the package manager from a directory's file list
/// 
/// This function accepts a HashSet of file names to avoid redundant directory reads.
/// Returns a string slice to avoid unnecessary allocations.
pub fn detect_package_manager(files: &HashSet<String>) -> &'static str {
    if has_file(files, "pnpm-lock.yaml") {
        "pnpm"
    } else if has_file(files, "yarn.lock") {
        "yarn"
    } else if has_file(files, "package-lock.json") {
        "npm"
    } else if has_file(files, "bun.lockb") {
        "bun"
    } else {
        "npm" // default
    }
}


/// Detects the framework from a directory's file list
/// 
/// This function accepts a HashSet of file names to avoid redundant directory reads.
/// For convenience, use `detect_framework_from_path()` which reads the directory.
/// Returns a string slice to avoid unnecessary allocations.
pub fn detect_framework(files: &HashSet<String>, path: &PathBuf) -> &'static str {
    // Astro
    if has_file(files, "astro.config.mjs")
        || has_file(files, "astro.config.js")
        || has_file(files, "astro.config.ts")
    {
        return "astro";
    }

    // Next.js
    if has_file(files, "next.config.js")
        || has_file(files, "next.config.mjs")
        || has_file(files, "next.config.ts")
    {
        return "nextjs";
    }

    // Vite (check for vite.config.*)
    if has_file(files, "vite.config.js")
        || has_file(files, "vite.config.ts")
        || has_file(files, "vite.config.mjs")
    {
        return "vite";
    }

    // React (Create React App)
    if has_file(files, "src") && has_file(files, "public") {
        if has_file(files, "package.json") {
            let package_json = path.join("package.json");
            if let Ok(content) = fs::read_to_string(&package_json) {
                if content.contains("react-scripts") {
                    return "react";
                }
            }
        }
    }

    // SvelteKit
    if has_file(files, "svelte.config.js") || has_file(files, "svelte.config.ts") {
        return "sveltekit";
    }

    // Nuxt
    if has_file(files, "nuxt.config.js") || has_file(files, "nuxt.config.ts") {
        return "nuxt";
    }

    // Default
    "node"
}

/// Convenience wrapper that reads the directory and calls `detect_framework()`
/// 
/// Use this for standalone calls. In `scan_directory()`, use `detect_framework()` 
/// directly with the pre-read HashSet to avoid redundant directory reads.
pub fn detect_framework_from_path(path: &PathBuf) -> &'static str {
    let files = get_directory_files(path);
    detect_framework(&files, path)
}

pub fn scan_directory(path: &Path) -> Result<Vec<Project>, AppError> {
    // Use metadata() for faster existence check (single syscall)
    // This will return IoError if path doesn't exist, NotFound if not a directory
    let metadata = fs::metadata(path).map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            AppError::NotFound(format!(
                "Directory does not exist: {}",
                path.display()
            ))
        } else {
            AppError::IoError(e.to_string())
        }
    })?;
    
    if !metadata.is_dir() {
        return Err(AppError::NotFound(format!(
            "Path is not a directory: {}",
            path.display()
        )));
    }

    // Use iterator chain for better performance and early filtering
    let projects: Result<Vec<Project>, AppError> = fs::read_dir(path)?
        .filter_map(|entry| {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => return None,
            };
            
            let project_path = entry.path();
            
            // Fast check: use metadata() instead of is_dir() to avoid extra syscall
            let metadata = match project_path.metadata() {
                Ok(m) => m,
                Err(_) => return None,
            };
            
            if !metadata.is_dir() {
                return None;
            }
            
            // Get directory files once for all checks
            let dir_files = get_directory_files(&project_path);
            
            // Check for Node.js projects
            if has_file(&dir_files, "package.json") {
                let package_manager = detect_package_manager(&dir_files).to_string();
                let framework = detect_framework(&dir_files, &project_path).to_string();
                let port = crate::port::detect_port(&project_path);
                let mut project = Project {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: project_path.to_string_lossy().to_string(),
                    runtime: "Node.js".to_string(),
                    package_manager: Some(package_manager),
                    port,
                    framework: Some(framework),
                    runtime_version: None,
                    scripts: None,
                    size: None,
                    modified: None,
                };
                project = enrich_project_info(project);
                Some(Ok(project))
            }
            // Check for Deno projects
            else if has_file(&dir_files, "deno.json") || has_file(&dir_files, "deno.jsonc") {
                let port = crate::port::detect_port_deno(&project_path);
                let mut project = Project {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: project_path.to_string_lossy().to_string(),
                    runtime: "Deno".to_string(),
                    package_manager: None,
                    port,
                    framework: Some("deno".to_string()),
                    runtime_version: None,
                    scripts: None,
                    size: None,
                    modified: None,
                };
                project = enrich_project_info(project);
                Some(Ok(project))
            }
            // Check for Bun projects
            else if has_file(&dir_files, "bun.lockb") || has_file(&dir_files, "bunfig.toml") {
                let framework = detect_framework(&dir_files, &project_path).to_string();
                let port = crate::port::detect_port(&project_path);
                let mut project = Project {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: project_path.to_string_lossy().to_string(),
                    runtime: "Bun".to_string(),
                    package_manager: Some("bun".to_string()),
                    port,
                    framework: Some(framework),
                    runtime_version: None,
                    scripts: None,
                    size: None,
                    modified: None,
                };
                project = enrich_project_info(project);
                Some(Ok(project))
            } else {
                None
            }
        })
        .collect();
    
    projects
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_temp_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp directory")
    }

    fn create_temp_file(dir: &std::path::Path, name: &str, content: &str) -> PathBuf {
        let file_path = dir.join(name);
        fs::write(&file_path, content).expect("Failed to write temp file");
        file_path
    }

    #[test]
    fn test_detect_package_manager_npm() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "package-lock.json", "{}");

        let files = get_directory_files(&dir_path);
        assert_eq!(detect_package_manager(&files), "npm");
    }

    #[test]
    fn test_detect_package_manager_yarn() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "yarn.lock", "");

        let files = get_directory_files(&dir_path);
        assert_eq!(detect_package_manager(&files), "yarn");
    }

    #[test]
    fn test_detect_package_manager_pnpm() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "pnpm-lock.yaml", "");

        let files = get_directory_files(&dir_path);
        assert_eq!(detect_package_manager(&files), "pnpm");
    }

    #[test]
    fn test_detect_package_manager_bun() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "bun.lockb", "");

        let files = get_directory_files(&dir_path);
        assert_eq!(detect_package_manager(&files), "bun");
    }

    #[test]
    fn test_detect_package_manager_default() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();

        // No lock file, should default to npm
        let files = get_directory_files(&dir_path);
        assert_eq!(detect_package_manager(&files), "npm");
    }

    #[test]
    fn test_detect_package_manager_priority() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        // pnpm should take priority over npm
        create_temp_file(temp_dir.path(), "package-lock.json", "{}");
        create_temp_file(temp_dir.path(), "pnpm-lock.yaml", "");

        let files = get_directory_files(&dir_path);
        assert_eq!(detect_package_manager(&files), "pnpm");
    }

    #[test]
    fn test_detect_framework_astro() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "astro.config.mjs", "");

        assert_eq!(detect_framework_from_path(&dir_path), "astro");
    }

    #[test]
    fn test_detect_framework_nextjs() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "next.config.js", "");

        assert_eq!(detect_framework_from_path(&dir_path), "nextjs");
    }

    #[test]
    fn test_detect_framework_vite() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "vite.config.ts", "");

        assert_eq!(detect_framework_from_path(&dir_path), "vite");
    }

    #[test]
    fn test_detect_framework_react() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        fs::create_dir(dir_path.join("src")).expect("Failed to create src dir");
        fs::create_dir(dir_path.join("public")).expect("Failed to create public dir");
        create_temp_file(
            temp_dir.path(),
            "package.json",
            r#"{"dependencies": {"react-scripts": "^5.0.0"}}"#,
        );

        assert_eq!(detect_framework_from_path(&dir_path), "react");
    }

    #[test]
    fn test_detect_framework_sveltekit() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "svelte.config.js", "");

        assert_eq!(detect_framework_from_path(&dir_path), "sveltekit");
    }

    #[test]
    fn test_detect_framework_nuxt() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "nuxt.config.ts", "");

        assert_eq!(detect_framework_from_path(&dir_path), "nuxt");
    }

    #[test]
    fn test_detect_framework_default() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();

        // No framework files, should default to "node"
        assert_eq!(detect_framework_from_path(&dir_path), "node");
    }

    #[test]
    fn test_detect_framework_priority() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        // Astro should take priority (checked first)
        create_temp_file(temp_dir.path(), "astro.config.mjs", "");
        create_temp_file(temp_dir.path(), "next.config.js", "");

        assert_eq!(detect_framework_from_path(&dir_path), "astro");
    }

    #[test]
    fn test_scan_directory_nonexistent() {
        let result = scan_directory(Path::new("/nonexistent/path/12345"));
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::NotFound(_)));
    }

    #[test]
    fn test_scan_directory_empty() {
        let temp_dir = create_temp_dir();
        let result = scan_directory(temp_dir.path());
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[test]
    fn test_scan_directory_nodejs_project() {
        let temp_dir = create_temp_dir();
        let project_dir = temp_dir.path().join("my-project");
        fs::create_dir(&project_dir).expect("Failed to create project dir");
        create_temp_file(&project_dir, "package.json", r#"{"name": "test-project"}"#);

        let result = scan_directory(temp_dir.path());
        assert!(result.is_ok());
        let projects = result.unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].name, "my-project");
        assert_eq!(projects[0].runtime, "Node.js");
    }

    #[test]
    fn test_scan_directory_deno_project() {
        let temp_dir = create_temp_dir();
        let project_dir = temp_dir.path().join("deno-project");
        fs::create_dir(&project_dir).expect("Failed to create project dir");
        create_temp_file(&project_dir, "deno.json", r#"{}"#);

        let result = scan_directory(temp_dir.path());
        assert!(result.is_ok());
        let projects = result.unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].name, "deno-project");
        assert_eq!(projects[0].runtime, "Deno");
    }

    #[test]
    fn test_scan_directory_bun_project() {
        let temp_dir = create_temp_dir();
        let project_dir = temp_dir.path().join("bun-project");
        fs::create_dir(&project_dir).expect("Failed to create project dir");
        create_temp_file(&project_dir, "bun.lockb", "");

        let result = scan_directory(temp_dir.path());
        assert!(result.is_ok());
        let projects = result.unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].name, "bun-project");
        assert_eq!(projects[0].runtime, "Bun");
    }

    #[test]
    fn test_scan_directory_multiple_projects() {
        let temp_dir = create_temp_dir();

        // Node.js project
        let node_dir = temp_dir.path().join("node-project");
        fs::create_dir(&node_dir).expect("Failed to create node dir");
        create_temp_file(&node_dir, "package.json", r#"{}"#);

        // Deno project
        let deno_dir = temp_dir.path().join("deno-project");
        fs::create_dir(&deno_dir).expect("Failed to create deno dir");
        create_temp_file(&deno_dir, "deno.json", r#"{}"#);

        let result = scan_directory(temp_dir.path());
        assert!(result.is_ok());
        let projects = result.unwrap();
        assert_eq!(projects.len(), 2);
    }

    #[test]
    fn test_scan_directory_ignores_files() {
        let temp_dir = create_temp_dir();
        create_temp_file(temp_dir.path(), "not-a-project.txt", "content");

        let result = scan_directory(temp_dir.path());
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }
}
