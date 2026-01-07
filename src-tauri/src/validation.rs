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
    // PID 0 is reserved for the kernel/swapper and is not a valid user-space process ID
    if pid == 0 {
        return Err(AppError::CommandError(
            "Invalid PID: 0 is reserved for the kernel and not a valid process".to_string(),
        ));
    }

    // Valid PIDs are typically in range 1-2^15 (32768) or 1-2^22 (4194304) depending on system.
    // We'll use a reasonable upper bound to catch obviously invalid values.
    if pid > 10_000_000 {
        return Err(AppError::CommandError(format!(
            "Invalid PID: {} (out of range)",
            pid
        )));
    }

    Ok(pid)
}

/// Whitelist of allowed commands to prevent command injection
/// Only package managers and runtime executables are allowed
const ALLOWED_COMMANDS: &[&str] = &[
    "npm", "pnpm", "yarn", "bun", "deno",
];

/// Validates that a command is in the whitelist of allowed commands
/// 
/// This prevents command injection by only allowing specific, safe commands.
/// Commands must match exactly (case-sensitive) to prevent bypass attempts.
pub fn validate_command(command: &str) -> Result<(), AppError> {
    if command.is_empty() {
        return Err(AppError::CommandError(
            "Command cannot be empty".to_string(),
        ));
    }

    // Check for path separators (prevents path-based command injection like "/bin/sh" or "../evil")
    if command.contains('/') || command.contains('\\') {
        return Err(AppError::CommandError(
            format!("Invalid command: '{}' contains path separators. Only command names are allowed.", command)
        ));
    }

    // Check for shell metacharacters that could be used for injection
    // These characters could allow command chaining or redirection
    let dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '<', '>', '\n', '\r'];
    if command.chars().any(|c| dangerous_chars.contains(&c)) {
        return Err(AppError::CommandError(
            format!("Invalid command: '{}' contains dangerous characters", command)
        ));
    }

    // Validate against whitelist
    if !ALLOWED_COMMANDS.contains(&command) {
        return Err(AppError::CommandError(
            format!("Invalid command: '{}' is not in the allowed list. Allowed commands: {}", 
                command, 
                ALLOWED_COMMANDS.join(", "))
        ));
    }

    Ok(())
}

/// Validates command arguments to prevent injection attacks
/// 
/// Arguments are checked for dangerous shell metacharacters that could allow
/// command injection when passed through a shell interpreter.
pub fn validate_command_args(args: &[String]) -> Result<(), AppError> {
    // Limit number of arguments to prevent DoS
    if args.len() > 100 {
        return Err(AppError::CommandError(
            format!("Too many arguments: {} (maximum 100 allowed)", args.len())
        ));
    }

    // Characters that could be used for command injection in shell context
    // Note: We allow some characters that are legitimate in arguments (like '=' for --port=4321)
    // but block those that could chain commands or redirect I/O
    let dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '<', '>', '\n', '\r', '\0'];
    
    for (index, arg) in args.iter().enumerate() {
        // Limit individual argument length
        if arg.len() > 1024 {
            return Err(AppError::CommandError(
                format!("Argument {} is too long: {} characters (maximum 1024)", index, arg.len())
            ));
        }

        // Check for dangerous characters
        if let Some(dangerous_char) = arg.chars().find(|c| dangerous_chars.contains(c)) {
            let char_name = match dangerous_char {
                '\n' => "newline",
                '\r' => "carriage return",
                '\0' => "null byte",
                c => return Err(AppError::CommandError(
                    format!("Invalid argument {}: contains dangerous character '{}'", index, c)
                )),
            };
            return Err(AppError::CommandError(
                format!("Invalid argument {}: contains dangerous character '{}'", index, char_name)
            ));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_validate_pid_rejects_zero() {
        assert!(validate_pid(0).is_err());
        let err = validate_pid(0).unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("0 is reserved"));
    }

    #[test]
    fn test_validate_pid_accepts_valid_pids() {
        assert_eq!(validate_pid(1).unwrap(), 1);
        assert_eq!(validate_pid(12345).unwrap(), 12345);
        assert_eq!(validate_pid(32768).unwrap(), 32768);
        assert_eq!(validate_pid(1000000).unwrap(), 1000000);
    }

    #[test]
    fn test_validate_pid_rejects_too_large() {
        assert!(validate_pid(10_000_001).is_err());
        let err = validate_pid(10_000_001).unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("out of range"));
    }

    #[test]
    fn test_validate_directory_path_rejects_empty() {
        assert!(validate_directory_path("").is_err());
        let err = validate_directory_path("").unwrap_err();
        assert!(matches!(err, AppError::NotFound(_)));
    }

    #[test]
    fn test_validate_directory_path_rejects_null_bytes() {
        assert!(validate_directory_path("/path\0/to/dir").is_err());
        let err = validate_directory_path("/path\0/to/dir").unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("null bytes"));
    }

    #[test]
    fn test_validate_directory_path_rejects_path_traversal() {
        assert!(validate_directory_path("../parent").is_err());
        assert!(validate_directory_path("../../etc").is_err());
        assert!(validate_directory_path("/path/../other").is_err());
        
        let err = validate_directory_path("../parent").unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("path traversal"));
    }

    #[test]
    fn test_validate_directory_path_rejects_too_long() {
        let long_path = "/".to_string() + &"a".repeat(4097);
        assert!(validate_directory_path(&long_path).is_err());
        let err = validate_directory_path(&long_path).unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("too long"));
    }

    #[test]
    fn test_validate_directory_path_rejects_nonexistent() {
        assert!(validate_directory_path("/nonexistent/path/12345").is_err());
        let err = validate_directory_path("/nonexistent/path/12345").unwrap_err();
        assert!(matches!(err, AppError::NotFound(_)));
    }

    #[test]
    fn test_validate_file_path_rejects_empty() {
        assert!(validate_file_path("").is_err());
        let err = validate_file_path("").unwrap_err();
        assert!(matches!(err, AppError::NotFound(_)));
    }

    #[test]
    fn test_validate_file_path_rejects_null_bytes() {
        assert!(validate_file_path("/path\0/to/file").is_err());
        let err = validate_file_path("/path\0/to/file").unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("null bytes"));
    }

    #[test]
    fn test_validate_file_path_rejects_path_traversal() {
        assert!(validate_file_path("../parent").is_err());
        assert!(validate_file_path("../../etc/passwd").is_err());
        assert!(validate_file_path("/path/../other").is_err());
        
        let err = validate_file_path("../parent").unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("path traversal"));
    }

    #[test]
    fn test_validate_file_path_rejects_too_long() {
        let long_path = "/".to_string() + &"a".repeat(4097);
        assert!(validate_file_path(&long_path).is_err());
        let err = validate_file_path(&long_path).unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("too long"));
    }

    #[test]
    fn test_validate_file_path_rejects_nonexistent() {
        assert!(validate_file_path("/nonexistent/file/12345.txt").is_err());
        let err = validate_file_path("/nonexistent/file/12345.txt").unwrap_err();
        assert!(matches!(err, AppError::NotFound(_)));
    }

    // Integration tests that require actual file system
    #[test]
    fn test_validate_directory_path_with_temp_dir() {
        // Use a unique temporary directory to avoid name collisions between tests
        let temp_dir = tempfile::tempdir().unwrap();

        // Test that it validates successfully
        let path_str = temp_dir.path().to_string_lossy();
        let result = validate_directory_path(&path_str);
        assert!(result.is_ok());
        // `temp_dir` is automatically cleaned up when it is dropped.
    }

    #[test]
    fn test_validate_file_path_with_temp_file() {
        // Use a unique temporary file to avoid name collisions between tests
        let temp_file = tempfile::NamedTempFile::new().unwrap();

        // Write content to the file to ensure it's not empty (matches previous test behavior)
        fs::write(temp_file.path(), "test content").unwrap();
        
        // Test that it validates successfully
        let path_str = temp_file.path().to_string_lossy();
        let result = validate_file_path(&path_str);
        assert!(result.is_ok());
        // `temp_file` is automatically cleaned up when it is dropped.
    }

    #[test]
    fn test_validate_directory_path_rejects_file() {
        // Use a unique temporary file to avoid name collisions between tests
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        
        // Write content to the file (matches previous test behavior)
        fs::write(temp_file.path(), "test content").unwrap();
        
        // Test that it rejects a file when expecting a directory
        let path_str = temp_file.path().to_string_lossy();
        let result = validate_directory_path(&path_str);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("not a directory"));
        // `temp_file` is automatically cleaned up when it is dropped.
    }

    #[test]
    fn test_validate_command_rejects_empty() {
        assert!(validate_command("").is_err());
        let err = validate_command("").unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("cannot be empty"));
    }

    #[test]
    fn test_validate_command_rejects_path_separators() {
        assert!(validate_command("/bin/sh").is_err());
        assert!(validate_command("../evil").is_err());
        assert!(validate_command("command\\path").is_err());
    }

    #[test]
    fn test_validate_command_rejects_dangerous_chars() {
        assert!(validate_command("cmd;rm").is_err());
        assert!(validate_command("cmd&evil").is_err());
        assert!(validate_command("cmd|hack").is_err());
        assert!(validate_command("cmd`backtick`").is_err());
        assert!(validate_command("cmd$var").is_err());
    }

    #[test]
    fn test_validate_command_rejects_not_in_whitelist() {
        assert!(validate_command("rm").is_err());
        assert!(validate_command("sh").is_err());
        assert!(validate_command("cat").is_err());
        let err = validate_command("rm").unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("not in the allowed list"));
    }

    #[test]
    fn test_validate_command_accepts_whitelisted() {
        assert!(validate_command("npm").is_ok());
        assert!(validate_command("pnpm").is_ok());
        assert!(validate_command("yarn").is_ok());
        assert!(validate_command("bun").is_ok());
        assert!(validate_command("deno").is_ok());
    }

    #[test]
    fn test_validate_command_args_rejects_too_many() {
        let many_args: Vec<String> = (0..101).map(|i| format!("arg{}", i)).collect();
        assert!(validate_command_args(&many_args).is_err());
        let err = validate_command_args(&many_args).unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("Too many arguments"));
    }

    #[test]
    fn test_validate_command_args_rejects_too_long() {
        let long_arg = "a".repeat(1025);
        assert!(validate_command_args(&[long_arg]).is_err());
        let err = validate_command_args(&[long_arg]).unwrap_err();
        assert!(matches!(err, AppError::CommandError(_)));
        assert!(err.to_string().contains("too long"));
    }

    #[test]
    fn test_validate_command_args_rejects_dangerous_chars() {
        assert!(validate_command_args(&["arg;rm".to_string()]).is_err());
        assert!(validate_command_args(&["arg&evil".to_string()]).is_err());
        assert!(validate_command_args(&["arg|hack".to_string()]).is_err());
        assert!(validate_command_args(&["arg`backtick`".to_string()]).is_err());
        assert!(validate_command_args(&["arg$var".to_string()]).is_err());
        assert!(validate_command_args(&["arg\nnewline".to_string()]).is_err());
        assert!(validate_command_args(&["arg\0null".to_string()]).is_err());
    }

    #[test]
    fn test_validate_command_args_accepts_safe_args() {
        assert!(validate_command_args(&[]).is_ok());
        assert!(validate_command_args(&["dev".to_string()]).is_ok());
        assert!(validate_command_args(&["run".to_string(), "dev".to_string()]).is_ok());
        assert!(validate_command_args(&["--port".to_string(), "4321".to_string()]).is_ok());
        assert!(validate_command_args(&["--port=4321".to_string()]).is_ok());
    }
}
