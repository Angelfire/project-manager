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
    // Use component-based validation to detect parent directory segments (`..`)
    let path_buf_for_validation = PathBuf::from(path);
    if path_buf_for_validation
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err(AppError::CommandError(
            "Invalid path: path traversal not allowed".to_string(),
        ));
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

/// Validates a path (file or directory) for quick actions.
/// 
/// This function:
/// - Ensures the path is non-empty
/// - Rejects null bytes
/// - Rejects parent directory components (`..`) to prevent traversal
/// - Enforces a maximum path length
/// - Checks that the path exists (but does *not* require it to be a file)
/// - Resolves the path to its canonical absolute form
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

    // Check for path traversal using component-based validation
    // This is more robust than string pattern matching and provides defense in depth
    let path_buf_for_validation = PathBuf::from(path);
    if path_buf_for_validation
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err(AppError::CommandError(
            "Invalid path: path traversal not allowed".to_string(),
        ));
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

    // Resolve to absolute path
    let canonical = path_buf
        .canonicalize()
        .map_err(|e| AppError::IoError(format!("Failed to canonicalize path: {}", e)))?;

    Ok(canonical)
}

/// Validates a process ID
pub fn validate_pid(pid: u32) -> Result<u32, AppError> {
    // PID 0 is reserved for the kernel/swapper and dangerous to kill
    // PID 1 is typically init/systemd and should not be killed
    // Reject PID 0 and PID 1 for safety
    if pid == 0 {
        return Err(AppError::CommandError(
            "Invalid PID: 0 is reserved for kernel and cannot be killed".to_string(),
        ));
    }
    
    if pid == 1 {
        return Err(AppError::CommandError(
            "Invalid PID: 1 is typically init/systemd and should not be killed".to_string(),
        ));
    }

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
