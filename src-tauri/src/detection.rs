use crate::types::Project;
use crate::project_info::enrich_project_info;
use std::fs;
use std::path::PathBuf;

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

pub fn scan_directory(path: String) -> Result<Vec<Project>, String> {
    let dir = PathBuf::from(&path);

    if !dir.exists() || !dir.is_dir() {
        return Err("Directory does not exist".to_string());
    }

    let mut projects = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries {
            if let Ok(entry) = entry {
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
        }
    }

    Ok(projects)
}

