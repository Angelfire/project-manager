use std::fmt;

#[derive(Debug)]
pub enum AppError {
    IoError(String),
    ProcessError(String),
    CommandError(String),
    ParseError(String),
    NotFound(String),
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

// Convert AppError to String for Tauri commands
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
