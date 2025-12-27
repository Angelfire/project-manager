use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub runtime: String,
    pub package_manager: Option<String>,
    pub port: Option<u16>,
    pub framework: Option<String>,
    pub runtime_version: Option<String>,
    pub scripts: Option<HashMap<String, String>>,
    pub size: Option<u64>,
    pub modified: Option<i64>,
}
