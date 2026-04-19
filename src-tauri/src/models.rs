use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type")]
pub enum Environment {
    Local,
    Ssh {
        id: String,
        name: String,
        host: String,
        port: u16,
        username: String,
        password: Option<String>,
    },
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub environments: Vec<Environment>,
    pub active_env_id: Option<String>, // "local" or a UUID
}

impl AppSettings {
    pub fn new() -> Self {
        Self {
            environments: vec![Environment::Local],
            active_env_id: Some("local".to_string()),
        }
    }
}
