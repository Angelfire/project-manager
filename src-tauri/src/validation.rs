use crate::error::AppError;
use std::path::PathBuf;

/// Validates that a path is safe to use
/// - Checks if path exists
/// - Checks if it's a directory
/// - Prevents path traversal attacks
pub fn validate_directory_path(path: &str) -> Result<PathBuf, AppError> {
    if path.is_empty() {
        return Err(AppError::NotFound("Path cannot be empty".to_string()));
    }

    // Check for null bytes (path traversal attempt)
    if path.contains('\0') {
        return Err(AppError::CommandError(
            "Invalid path: null bytes not allowed".to_string(),
        ));
    }

    // Check for suspicious patterns (basic path traversal detection)
    if path.contains("..") {
        // Allow .. only if it's part of a valid relative path that doesn't escape
        // For now, we'll be strict and reject any .. patterns
        // In production, you might want more sophisticated validation
        let path_buf = PathBuf::from(path);
        if path_buf.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
            return Err(AppError::CommandError(
                "Invalid path: path traversal not allowed".to_string(),
            ));
        }
    }

    // Limit path length (prevent DoS)
    if path.len() > 4096 {
        return Err(AppError::CommandError(
            "Invalid path: path too long".to_string(),
        ));
    }

    let path_buf = PathBuf::from(path);

    // Check if path exists
    if !path_buf.exists() {
        return Err(AppError::NotFound(format!("Path does not exist: {}", path)));
    }

    // Check if it's a directory
    if !path_buf.is_dir() {
        return Err(AppError::CommandError(format!(
            "Path is not a directory: {}",
            path
        )));
    }

    // Resolve to absolute path to prevent symlink attacks
    let canonical = path_buf
        .canonicalize()
        .map_err(|e| AppError::IoError(format!("Failed to canonicalize path: {}", e)))?;

    Ok(canonical)
}

/// Validates a file path (for quick actions)
pub fn validate_file_path(path: &str) -> Result<PathBuf, AppError> {
    if path.is_empty() {
        return Err(AppError::NotFound("Path cannot be empty".to_string()));
    }

    // Check for null bytes
    if path.contains('\0') {
        return Err(AppError::CommandError(
            "Invalid path: null bytes not allowed".to_string(),
        ));
    }

    // Limit path length
    if path.len() > 4096 {
        return Err(AppError::CommandError(
            "Invalid path: path too long".to_string(),
        ));
    }

    let path_buf = PathBuf::from(path);

    // Check if path exists
    if !path_buf.exists() {
        return Err(AppError::NotFound(format!("Path does not exist: {}", path)));
    }

    // Resolve to absolute path
    let canonical = path_buf
        .canonicalize()
        .map_err(|e| AppError::IoError(format!("Failed to canonicalize path: {}", e)))?;

    Ok(canonical)
}

/// Validates a process ID
pub fn validate_pid(pid: u32) -> Result<u32, AppError> {
    // PID 0 is typically reserved for the kernel/swapper
    // PID 1 is typically init/systemd
    // Valid PIDs are typically in range 1-2^15 (32768) or 1-2^22 (4194304) depending on system
    // We'll use a reasonable upper bound
    if pid > 10_000_000 {
        return Err(AppError::CommandError(format!(
            "Invalid PID: {} (out of range)",
            pid
        )));
    }

    Ok(pid)
}

/// Validates a port number
#[allow(dead_code)] // May be used in the future
pub fn validate_port(port: u16) -> Result<u16, AppError> {
    // Port 0 is valid (requests OS to assign ephemeral port)
    // Valid port range is 0-65535
    // No additional validation needed as u16 already enforces this
    Ok(port)
}

/// Sanitizes a path string to prevent command injection
/// Removes or escapes dangerous characters
#[allow(dead_code)] // May be used in the future
pub fn sanitize_path_for_command(path: &str) -> String {
    // Replace single quotes with escaped version for shell safety
    path.replace("'", "'\"'\"'")
}

