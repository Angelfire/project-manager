use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    #[serde(rename = "io_error")]
    IoError(String),
    #[serde(rename = "process_error")]
    ProcessError(String),
    #[serde(rename = "command_error")]
    CommandError(String),
    #[serde(rename = "parse_error")]
    ParseError(String),
    #[serde(rename = "not_found")]
    NotFound(String),
    #[serde(rename = "utf8_error")]
    Utf8Error(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::IoError(msg) => write!(f, "IO error: {}", msg),
            AppError::ProcessError(msg) => write!(f, "Process error: {}", msg),
            AppError::CommandError(msg) => write!(f, "Command error: {}", msg),
            AppError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::Utf8Error(msg) => write!(f, "UTF-8 error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::IoError(err.to_string())
    }
}

impl From<std::string::FromUtf8Error> for AppError {
    fn from(err: std::string::FromUtf8Error) -> Self {
        AppError::Utf8Error(err.to_string())
    }
}

impl From<std::num::ParseIntError> for AppError {
    fn from(err: std::num::ParseIntError) -> Self {
        AppError::ParseError(err.to_string())
    }
}

// AppError is now serializable, so we can return it directly from Tauri commands
// For backward compatibility, we keep the String conversion
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_error_display() {
        let io_err = AppError::IoError("test io error".to_string());
        assert!(io_err.to_string().contains("IO error"));
        assert!(io_err.to_string().contains("test io error"));

        let cmd_err = AppError::CommandError("test command error".to_string());
        assert!(cmd_err.to_string().contains("Command error"));
        assert!(cmd_err.to_string().contains("test command error"));

        let not_found = AppError::NotFound("test not found".to_string());
        assert!(not_found.to_string().contains("Not found"));
        assert!(not_found.to_string().contains("test not found"));
    }

    #[test]
    fn test_app_error_from_io_error() {
        let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let app_error: AppError = io_error.into();
        assert!(matches!(app_error, AppError::IoError(_)));
        assert!(app_error.to_string().contains("file not found"));
    }

    #[test]
    fn test_app_error_from_string() {
        let app_error = AppError::CommandError("test".to_string());
        let string: String = app_error.into();
        assert!(string.contains("Command error"));
        assert!(string.contains("test"));
    }

    #[test]
    fn test_app_error_debug() {
        let err = AppError::IoError("test".to_string());
        let debug_str = format!("{:?}", err);
        assert!(debug_str.contains("IoError"));
        assert!(debug_str.contains("test"));
    }
}
