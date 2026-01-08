use std::fs;
use std::path::PathBuf;

pub fn detect_port(path: &PathBuf) -> Option<u16> {
    // Detect specific framework and its default port
    // Use the cached detection from scan_directory when possible
    let framework = crate::detection::detect_framework_from_path(path);

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
    // Use metadata check first (faster than exists())
    if fs::metadata(&package_json_path).is_err() {
        return None;
    }

    let content = match fs::read_to_string(&package_json_path) {
        Ok(content) => content,
        Err(_) => return None,
    };
    
    // Parse JSON once and reuse
    let json_value = match serde_json::from_str::<serde_json::Value>(&content) {
        Ok(value) => value,
        Err(_) => return None,
    };
    
    // Search in scripts
    let scripts = match json_value.get("scripts").and_then(|s| s.as_object()) {
        Some(scripts) => scripts,
        None => return None,
    };
    
    // Search in "dev" script first (most common)
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
        let content = match (config_path.exists(), fs::read_to_string(&config_path)) {
            (true, Ok(content)) => content,
            _ => continue,
        };
        
        // Search for server: { port: 4321 } or port: 4321
        if let Some(port) = extract_port_from_config_file(&content, "port") {
            return Some(port);
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
    // Search for patterns like "port: 4321" or "port:4321" or nested "server: { port: 4321 }"
    // Handle both single-line and multi-line formats
    // Filter out commented lines to avoid false positives
    let lines: Vec<&str> = content.lines().collect();
    
    for (i, line) in lines.iter().enumerate() {
        // Skip lines that are comments (starting with // or # or /* after trimming)
        let trimmed = line.trim();
        if trimmed.starts_with("//") || trimmed.starts_with("#") || trimmed.starts_with("/*") || trimmed.starts_with("*") {
            continue;
        }
        
        // Direct match: port: 4321 or "port": 4321
        if line.contains(key) && line.contains(':') {
            // Try to extract port from this line
            if let Some(port) = extract_port_from_line(line, key) {
                return Some(port);
            }
        }
        
        // Handle nested structures like: server: { ... port: 4321 ... }
        // Can be multi-line: "server: {\n  port: 4321\n}"
        // Use more specific pattern matching: "server:" or "server {" to avoid false positives
        if line.contains("server:") || line.contains("server {") {
            // Check the next few lines for a port declaration (multi-line format)
            let search_range = std::cmp::min(i + 4, lines.len());
            for j in (i + 1)..search_range {
                let next_line = match lines.get(j) {
                    Some(line) => line,
                    None => continue,
                };
                
                // Skip commented lines
                let next_trimmed = next_line.trim();
                if next_trimmed.starts_with("//") 
                    || next_trimmed.starts_with("#") 
                    || next_trimmed.starts_with("/*") 
                    || next_trimmed.starts_with("*") {
                    continue;
                }
                
                if next_line.contains(key) && next_line.contains(':') {
                    if let Some(port) = extract_port_from_line(next_line, key) {
                        return Some(port);
                    }
                }
            }
        }
    }
    None
}

fn extract_port_from_line(line: &str, key: &str) -> Option<u16> {
    // Find the position of "port:" in the line (must be followed by colon)
    let search_pattern = format!("{}:", key);
    let key_pos = line.find(&search_pattern)?;
    let value_start = key_pos + search_pattern.len();
    
    if value_start >= line.len() {
        return None;
    }
    
    // Extract everything after "port:"
    let value_part = &line[value_start..];
    // Split by whitespace, comma, or closing brace to get the number
    // Filter out empty strings and find the first non-empty part
    let port_str = value_part
        .split(|c: char| c.is_whitespace() || c == ',' || c == '}' || c == ')' || c == ']')
        .find(|s| !s.is_empty())
        .unwrap_or("")
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .trim_matches('{')
        .trim_matches('[')
        .trim_matches('(');
    
    port_str
        .parse::<u16>()
        .ok()
        .filter(|&port| port > 0)
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

        // Search for PORT=3000, --port=3000, or -p=3000
        let port = word
            .strip_prefix("PORT=")
            .or_else(|| word.strip_prefix("--port="))
            .or_else(|| word.strip_prefix("-p="))
            .and_then(|port_str| port_str.parse::<u16>().ok());
        
        if let Some(port) = port {
            return Some(port);
        }

        // Search for :3000 or localhost:3000 (only if it looks like a valid port)
        if word.contains(':') {
            let port = word
                .split(':')
                .last()
                .filter(|port_str| port_str.len() <= 5 && port_str.chars().all(|c| c.is_ascii_digit()))
                .and_then(|port_str| port_str.parse::<u16>().ok())
                .filter(|&port| port > 0);
            
            if let Some(port) = port {
                return Some(port);
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_temp_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp directory")
    }

    fn create_temp_file(dir: &PathBuf, name: &str, content: &str) -> PathBuf {
        let file_path = dir.join(name);
        fs::write(&file_path, content).expect("Failed to write temp file");
        file_path
    }

    #[test]
    fn test_get_default_port_astro() {
        assert_eq!(get_default_port("astro"), Some(4321));
    }

    #[test]
    fn test_get_default_port_nextjs() {
        assert_eq!(get_default_port("nextjs"), Some(3000));
    }

    #[test]
    fn test_get_default_port_vite() {
        assert_eq!(get_default_port("vite"), Some(5173));
    }

    #[test]
    fn test_get_default_port_react() {
        assert_eq!(get_default_port("react"), Some(3000));
    }

    #[test]
    fn test_get_default_port_sveltekit() {
        assert_eq!(get_default_port("sveltekit"), Some(5173));
    }

    #[test]
    fn test_get_default_port_nuxt() {
        assert_eq!(get_default_port("nuxt"), Some(3000));
    }

    #[test]
    fn test_get_default_port_unknown() {
        assert_eq!(get_default_port("unknown"), Some(3000));
    }

    #[test]
    fn test_get_default_port_node() {
        assert_eq!(get_default_port("node"), Some(3000));
    }

    #[test]
    fn test_detect_port_deno() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        assert_eq!(detect_port_deno(&dir_path), Some(8000));
    }

    #[test]
    fn test_extract_port_from_string_port_flag() {
        assert_eq!(extract_port_from_string("--port 3000"), Some(3000));
        assert_eq!(extract_port_from_string("-p 5173"), Some(5173));
    }

    #[test]
    fn test_extract_port_from_string_port_env() {
        assert_eq!(extract_port_from_string("PORT=3000"), Some(3000));
        assert_eq!(extract_port_from_string("PORT=8080 dev"), Some(8080));
    }

    #[test]
    fn test_extract_port_from_string_port_equals() {
        assert_eq!(extract_port_from_string("--port=3000"), Some(3000));
        assert_eq!(extract_port_from_string("-p=5173"), Some(5173));
    }

    #[test]
    fn test_extract_port_from_string_colon() {
        assert_eq!(extract_port_from_string(":3000"), Some(3000));
        assert_eq!(extract_port_from_string("localhost:8080"), Some(8080));
    }

    #[test]
    fn test_extract_port_from_string_no_port() {
        assert_eq!(extract_port_from_string("npm run dev"), None);
        assert_eq!(extract_port_from_string(""), None);
    }

    #[test]
    fn test_extract_port_from_string_multiple_ports() {
        // Should return the first valid port found
        assert_eq!(extract_port_from_string("--port 3000 --port 8080"), Some(3000));
    }

    #[test]
    fn test_detect_port_from_package_json() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(
            &dir_path,
            "package.json",
            r#"{"scripts": {"dev": "vite --port 5173"}}"#,
        );

        assert_eq!(detect_port_from_package_json(&dir_path), Some(5173));
    }

    #[test]
    fn test_detect_port_from_package_json_no_port() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(
            &dir_path,
            "package.json",
            r#"{"scripts": {"dev": "vite"}}"#,
        );

        assert_eq!(detect_port_from_package_json(&dir_path), None);
    }

    #[test]
    fn test_detect_port_from_package_json_start_script() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(
            &dir_path,
            "package.json",
            r#"{"scripts": {"start": "node server.js --port 3000"}}"#,
        );

        assert_eq!(detect_port_from_package_json(&dir_path), Some(3000));
    }

    #[test]
    fn test_detect_astro_port() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(
            &dir_path,
            "astro.config.mjs",
            "export default { server: { port: 4321 } }",
        );

        assert_eq!(detect_astro_port(&dir_path), Some(4321));
    }

    #[test]
    fn test_detect_nextjs_port() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(
            &dir_path,
            "next.config.js",
            "module.exports = { port: 3000 }",
        );

        assert_eq!(detect_nextjs_port(&dir_path), Some(3000));
    }

    #[test]
    fn test_detect_vite_port() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        create_temp_file(
            &dir_path,
            "vite.config.ts",
            "export default { server: { port: 5173 } }",
        );

        assert_eq!(detect_vite_port(&dir_path), Some(5173));
    }

    #[test]
    fn test_detect_port_default() {
        let temp_dir = create_temp_dir();
        let dir_path = temp_dir.path().to_path_buf();
        // No config files, should return default port based on framework
        create_temp_file(&dir_path, "package.json", r#"{}"#);

        // Should return default port (3000 for node framework)
        let port = detect_port(&dir_path);
        assert!(port.is_some());
    }
}
