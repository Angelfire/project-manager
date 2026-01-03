use crate::error::AppError;
use crate::project_info::enrich_project_info;
use crate::types::Project;
use std::fs;
use std::path::{Path, PathBuf};

pub fn detect_package_manager(path: &PathBuf) -> String {
    if path.join("pnpm-lock.yaml").exists() {
        "pnpm".to_string()
    } else if path.join("yarn.lock").exists() {
        "yarn".to_string()
    } else if path.join("package-lock.json").exists() {
        "npm".to_string()
    } else if path.join("bun.lockb").exists() {
        "bun".to_string()
    } else {
        "npm".to_string() // default
    }
}

pub fn detect_framework(path: &PathBuf) -> String {
    // Astro
    if path.join("astro.config.mjs").exists()
        || path.join("astro.config.js").exists()
        || path.join("astro.config.ts").exists()
    {
        return "astro".to_string();
    }

    // Next.js
    if path.join("next.config.js").exists()
        || path.join("next.config.mjs").exists()
        || path.join("next.config.ts").exists()
    {
        return "nextjs".to_string();
    }

    // Vite (verificar vite.config.*)
    if path.join("vite.config.js").exists()
        || path.join("vite.config.ts").exists()
        || path.join("vite.config.mjs").exists()
    {
        return "vite".to_string();
    }

    // React (Create React App)
    if path.join("src").exists() && path.join("public").exists() {
        let package_json = path.join("package.json");
        if package_json.exists() {
            if let Ok(content) = fs::read_to_string(&package_json) {
                if content.contains("react-scripts") {
                    return "react".to_string();
                }
            }
        }
    }

    // SvelteKit
    if path.join("svelte.config.js").exists() || path.join("svelte.config.ts").exists() {
        return "sveltekit".to_string();
    }

    // Nuxt
    if path.join("nuxt.config.js").exists() || path.join("nuxt.config.ts").exists() {
        return "nuxt".to_string();
    }

    // Default
    "node".to_string()
}

pub fn scan_directory(path: &Path) -> Result<Vec<Project>, AppError> {
    if !path.exists() || !path.is_dir() {
        return Err(AppError::NotFound(format!(
            "Directory does not exist: {}",
            path.display()
        )));
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(path)?;

    for entry in entries {
        let entry = entry?;
        let project_path = entry.path();

        if project_path.is_dir() {
            // Check for Node.js projects
            if project_path.join("package.json").exists() {
                let package_manager = detect_package_manager(&project_path);
                let framework = detect_framework(&project_path);
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
                projects.push(project);
            }
            // Check for Deno projects
            else if project_path.join("deno.json").exists()
                || project_path.join("deno.jsonc").exists()
            {
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
                projects.push(project);
            }
            // Check for Bun projects
            else if project_path.join("bun.lockb").exists()
                || project_path.join("bunfig.toml").exists()
            {
                let framework = detect_framework(&project_path);
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
                projects.push(project);
            }
        }
    }

    Ok(projects)
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

        assert_eq!(detect_package_manager(&dir_path), "npm");
    }

    #[test]
    fn test_detect_package_manager_yarn() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "yarn.lock", "");

        assert_eq!(detect_package_manager(&dir_path), "yarn");
    }

    #[test]
    fn test_detect_package_manager_pnpm() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "pnpm-lock.yaml", "");

        assert_eq!(detect_package_manager(&dir_path), "pnpm");
    }

    #[test]
    fn test_detect_package_manager_bun() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "bun.lockb", "");

        assert_eq!(detect_package_manager(&dir_path), "bun");
    }

    #[test]
    fn test_detect_package_manager_default() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();

        // No lock file, should default to npm
        assert_eq!(detect_package_manager(&dir_path), "npm");
    }

    #[test]
    fn test_detect_package_manager_priority() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        // pnpm should take priority over npm
        create_temp_file(temp_dir.path(), "package-lock.json", "{}");
        create_temp_file(temp_dir.path(), "pnpm-lock.yaml", "");

        assert_eq!(detect_package_manager(&dir_path), "pnpm");
    }

    #[test]
    fn test_detect_framework_astro() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "astro.config.mjs", "");

        assert_eq!(detect_framework(&dir_path), "astro");
    }

    #[test]
    fn test_detect_framework_nextjs() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "next.config.js", "");

        assert_eq!(detect_framework(&dir_path), "nextjs");
    }

    #[test]
    fn test_detect_framework_vite() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "vite.config.ts", "");

        assert_eq!(detect_framework(&dir_path), "vite");
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

        assert_eq!(detect_framework(&dir_path), "react");
    }

    #[test]
    fn test_detect_framework_sveltekit() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "svelte.config.js", "");

        assert_eq!(detect_framework(&dir_path), "sveltekit");
    }

    #[test]
    fn test_detect_framework_nuxt() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(temp_dir.path(), "nuxt.config.ts", "");

        assert_eq!(detect_framework(&dir_path), "nuxt");
    }

    #[test]
    fn test_detect_framework_default() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();

        // No framework files, should default to "node"
        assert_eq!(detect_framework(&dir_path), "node");
    }

    #[test]
    fn test_detect_framework_priority() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        // Astro should take priority (checked first)
        create_temp_file(temp_dir.path(), "astro.config.mjs", "");
        create_temp_file(temp_dir.path(), "next.config.js", "");

        assert_eq!(detect_framework(&dir_path), "astro");
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
