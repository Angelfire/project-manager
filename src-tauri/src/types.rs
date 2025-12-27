use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub runtime: String,
    pub package_manager: Option<String>,
    pub port: Option<u16>,
    pub framework: Option<String>,
}
