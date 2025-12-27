use std::fs;
use std::path::PathBuf;

pub fn detect_port(path: &PathBuf) -> Option<u16> {
    // Detect specific framework and its default port
    let framework = crate::detection::detect_framework(path);

    // Try to read port from framework configuration files
    if let Some(port) = detect_port_from_config(path, &framework) {
        return Some(port);
    }

    // Try to read port from package.json scripts
    if let Some(port) = detect_port_from_package_json(path) {
        return Some(port);
    }

    // Use default port based on framework
    get_default_port(&framework)
}

pub fn get_default_port(framework: &str) -> Option<u16> {
    match framework {
        "astro" => Some(4321),
        "nextjs" => Some(3000),
        "vite" => Some(5173),
        "react" => Some(3000),
        "sveltekit" => Some(5173),
        "nuxt" => Some(3000),
        _ => Some(3000), // Generic default port
    }
}

fn detect_port_from_config(path: &PathBuf, framework: &str) -> Option<u16> {
    match framework {
        "astro" => detect_astro_port(path),
        "nextjs" => detect_nextjs_port(path),
        "vite" => detect_vite_port(path),
        _ => None,
    }
}

fn detect_port_from_package_json(path: &PathBuf) -> Option<u16> {
    let package_json_path = path.join("package.json");
    if !package_json_path.exists() {
        return None;
    }

    if let Ok(content) = fs::read_to_string(&package_json_path) {
        if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&content) {
            // Search in scripts
            if let Some(scripts) = json_value.get("scripts").and_then(|s| s.as_object()) {
                // Search in "dev" script
                if let Some(dev_script) = scripts.get("dev").and_then(|s| s.as_str()) {
                    if let Some(port) = extract_port_from_string(dev_script) {
                        return Some(port);
                    }
                }
                // If not in dev, search in start
                if let Some(start_script) = scripts.get("start").and_then(|s| s.as_str()) {
                    if let Some(port) = extract_port_from_string(start_script) {
                        return Some(port);
                    }
                }
            }
        }
    }

    None
}

fn detect_astro_port(path: &PathBuf) -> Option<u16> {
    // Search in astro.config.mjs, astro.config.js, or astro.config.ts
    let config_files = vec![
        path.join("astro.config.mjs"),
        path.join("astro.config.js"),
        path.join("astro.config.ts"),
    ];

    for config_path in config_files {
        if config_path.exists() {
            if let Ok(content) = fs::read_to_string(&config_path) {
                // Search for server: { port: 4321 } or port: 4321
                if let Some(port) = extract_port_from_config_file(&content, "port") {
                    return Some(port);
                }
            }
        }
    }

    None
}

fn detect_nextjs_port(path: &PathBuf) -> Option<u16> {
    // Next.js can have port in next.config.js or in package.json
    let config_files = vec![
        path.join("next.config.js"),
        path.join("next.config.mjs"),
        path.join("next.config.ts"),
    ];

    for config_path in config_files {
        if config_path.exists() {
            if let Ok(content) = fs::read_to_string(&config_path) {
                // Search in configuration
                if let Some(port) = extract_port_from_config_file(&content, "port") {
                    return Some(port);
                }
            }
        }
    }

    None
}

fn detect_vite_port(path: &PathBuf) -> Option<u16> {
    // Vite can have port in vite.config.js, vite.config.ts, or vite.config.mjs
    let config_files = vec![
        path.join("vite.config.js"),
        path.join("vite.config.ts"),
        path.join("vite.config.mjs"),
    ];

    for config_path in config_files {
        if config_path.exists() {
            if let Ok(content) = fs::read_to_string(&config_path) {
                // Search for server: { port: 5173 } or port: 5173
                if let Some(port) = extract_port_from_config_file(&content, "port") {
                    return Some(port);
                }
            }
        }
    }

    None
}

fn extract_port_from_config_file(content: &str, key: &str) -> Option<u16> {
    let lines: Vec<&str> = content.lines().collect();
    for line in lines {
        // Search for key: followed by a number (e.g., port: 4321, "port": 4321)
        if line.contains(key) && line.contains(':') {
            let parts: Vec<&str> = line.split(':').collect();
            if parts.len() >= 2 {
                // Clean the value (remove spaces, commas, braces, quotes, etc.)
                let port_str = parts[1]
                    .trim()
                    .trim_matches(',')
                    .trim_matches('"')
                    .trim_matches('\'')
                    .trim_matches('}')
                    .trim_matches('{')
                    .trim();
                if let Ok(port) = port_str.parse::<u16>() {
                    if port > 0 {
                        return Some(port);
                    }
                }
            }
        }
    }
    None
}

pub fn detect_port_deno(_path: &PathBuf) -> Option<u16> {
    // Deno typically uses port 8000 by default
    Some(8000)
}

fn extract_port_from_string(s: &str) -> Option<u16> {
    // Search for patterns like --port 3000, -p 3000, PORT=3000, :3000, etc.
    let words: Vec<&str> = s.split_whitespace().collect();

    for (i, word) in words.iter().enumerate() {
        // Search for --port or -p followed by a number
        if (*word == "--port" || *word == "-p") && i + 1 < words.len() {
            if let Ok(port) = words[i + 1].parse::<u16>() {
                return Some(port);
            }
        }

        // Search for PORT=3000 or PORT:3000
        if word.starts_with("PORT=") {
            if let Some(port_str) = word.strip_prefix("PORT=") {
                if let Ok(port) = port_str.parse::<u16>() {
                    return Some(port);
                }
            }
        }

        // Search for --port=3000 or -p=3000
        if word.starts_with("--port=") {
            if let Some(port_str) = word.strip_prefix("--port=") {
                if let Ok(port) = port_str.parse::<u16>() {
                    return Some(port);
                }
            }
        }

        // Search for :3000 or localhost:3000 (only if it looks like a valid port)
        if word.contains(':') {
            let parts: Vec<&str> = word.split(':').collect();
            if parts.len() >= 2 {
                if let Some(port_str) = parts.last() {
                    // Filter only valid numbers (not full URLs)
                    if port_str.len() <= 5 && port_str.chars().all(|c| c.is_ascii_digit()) {
                        if let Ok(port) = port_str.parse::<u16>() {
                            if port > 0 {
                                return Some(port);
                            }
                        }
                    }
                }
            }
        }
    }

    None
}
