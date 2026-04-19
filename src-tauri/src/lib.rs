// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::sync::Mutex;
use tauri::menu::{MenuBuilder, MenuItem, SubmenuBuilder};
use tauri::{Emitter, Manager, State};

mod models;
mod runner;

use models::{AppSettings, Environment};
use runner::execute_docker;

pub struct AppState(pub Mutex<AppSettings>);

fn get_active_env(state: &State<'_, AppState>) -> Result<Environment, String> {
    let settings = state.0.lock().map_err(|_| "Failed to lock state")?;
    let env_id = settings.active_env_id.as_deref().unwrap_or("local");
    
    if env_id == "local" {
        return Ok(Environment::Local);
    }
    
    settings
        .environments
        .iter()
        .find(|e| match e {
            Environment::Local => false,
            Environment::Ssh { id, .. } => id == env_id,
        })
        .cloned()
        .ok_or_else(|| "Active environment not found".to_string())
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.0.lock().map_err(|_| "Failed to lock state")?;
    Ok(settings.clone())
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, state: State<'_, AppState>, new_settings: AppSettings) -> Result<(), String> {
    let mut settings = state.0.lock().map_err(|_| "Failed to lock state")?;
    *settings = new_settings.clone();
    
    let app_config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_config_dir).map_err(|e| e.to_string())?;
    let config_path = app_config_dir.join("settings.json");
    
    let json = serde_json::to_string_pretty(&new_settings).map_err(|e| e.to_string())?;
    fs::write(config_path, json).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn docker_ps(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["ps", "-a", "--format", "{{json .}}"], &env, None)?;

    if !output.success {
        return Err(output.stderr);
    }

    let containers = output.stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(containers)
}

#[tauri::command]
fn docker_images(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["images", "--format", "{{json .}}"], &env, None)?;

    if !output.success {
        return Err(output.stderr);
    }

    let images = output.stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(images)
}

#[tauri::command]
fn docker_services(state: State<'_, AppState>, path: String) -> Result<Vec<serde_json::Value>, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["compose", "ps", "--format", "{{json .}}"], &env, Some(&path))?;

    if !output.success {
        return Err(output.stderr);
    }

    let services = output.stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(services)
}

#[tauri::command]
fn docker_stop_container(state: State<'_, AppState>, name: String) -> Result<String, String> {
    let clean = name.trim_start_matches('/').to_string();
    let env = get_active_env(&state)?;
    let output = execute_docker(&["stop", &clean], &env, None)?;
    if output.success {
        Ok(clean)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_remove_container(state: State<'_, AppState>, name: String) -> Result<String, String> {
    let clean = name.trim_start_matches('/').to_string();
    let env = get_active_env(&state)?;
    let output = execute_docker(&["rm", &clean], &env, None)?;
    if output.success {
        Ok(clean)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_start_container(state: State<'_, AppState>, name: String) -> Result<String, String> {
    let clean = name.trim_start_matches('/').to_string();
    let env = get_active_env(&state)?;
    let output = execute_docker(&["start", &clean], &env, None)?;
    if output.success {
        Ok(clean)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_delete_image(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["rmi", &id], &env, None)?;
    if output.success {
        Ok(id)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_compose_stop_service(state: State<'_, AppState>, path: String, service: String) -> Result<String, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["compose", "stop", &service], &env, Some(&path))?;
    if output.success {
        Ok(service)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_compose_remove_service(state: State<'_, AppState>, path: String, service: String) -> Result<String, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["compose", "rm", "-f", &service], &env, Some(&path))?;
    if output.success {
        Ok(service)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_remove_network(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["network", "rm", &id], &env, None)?;
    if output.success {
        Ok(id)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_remove_volume(state: State<'_, AppState>, name: String) -> Result<String, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["volume", "rm", &name], &env, None)?;
    if output.success {
        Ok(name)
    } else {
        Err(output.stderr)
    }
}

#[tauri::command]
fn docker_networks(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["network", "ls", "--format", "{{json .}}"], &env, None)?;

    if !output.success {
        return Err(output.stderr);
    }

    let networks = output.stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(networks)
}

#[tauri::command]
fn docker_volumes(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let env = get_active_env(&state)?;
    let output = execute_docker(&["volume", "ls", "--format", "{{json .}}"], &env, None)?;

    if !output.success {
        return Err(output.stderr);
    }

    let volumes = output.stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(volumes)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            docker_ps,
            docker_images,
            docker_services,
            docker_networks,
            docker_volumes,
            docker_remove_network,
            docker_remove_volume,
            docker_stop_container,
            docker_start_container,
            docker_remove_container,
            docker_delete_image,
            docker_compose_stop_service,
            docker_compose_remove_service
        ])
        .setup(|app| {
            let handle = app.handle();

            let app_config_dir = handle.path().app_config_dir().expect("Failed to get config dir");
            let config_path = app_config_dir.join("settings.json");
            
            let settings = if config_path.exists() {
                let content = fs::read_to_string(&config_path).unwrap_or_default();
                serde_json::from_str(&content).unwrap_or_else(|_| AppSettings::new())
            } else {
                AppSettings::new()
            };
            
            app.manage(AppState(Mutex::new(settings)));

            let images_item = MenuItem::with_id(handle, "nav:images", "Images", true, Some("CmdOrCtrl+1")).unwrap();
            let containers_item = MenuItem::with_id(handle, "nav:containers", "Containers", true, Some("CmdOrCtrl+2")).unwrap();
            let services_item = MenuItem::with_id(handle, "nav:services", "Services", true, Some("CmdOrCtrl+3")).unwrap();
            let networks_item = MenuItem::with_id(handle, "nav:networks", "Networks", true, Some("CmdOrCtrl+4")).unwrap();
            let volumes_item = MenuItem::with_id(handle, "nav:volumes", "Volumes", true, Some("CmdOrCtrl+5")).unwrap();
            let environments_item = MenuItem::with_id(handle, "nav:environments", "Environments", true, Some("CmdOrCtrl+6")).unwrap();
            let refresh_item = MenuItem::with_id(handle, "action:refresh", "Refresh", true, Some("CmdOrCtrl+R")).unwrap();

            let quit_item = MenuItem::with_id(handle, "app:quit", "Quit", true, Some("CmdOrCtrl+Q")).unwrap();
            let file_menu = SubmenuBuilder::new(handle, "File").item(&quit_item).build().unwrap();

            let view_menu = SubmenuBuilder::new(handle, "View")
                .item(&images_item)
                .item(&containers_item)
                .item(&services_item)
                .item(&networks_item)
                .item(&volumes_item)
                .item(&environments_item)
                .separator()
                .item(&refresh_item)
                .build().unwrap();

            let settings_item = MenuItem::with_id(handle, "app:settings", "Settings", true, Some("CmdOrCtrl+,")).unwrap();
            let about_item = MenuItem::with_id(handle, "app:about", "About Dockyard", true, None::<&str>).unwrap();

            let help_menu = SubmenuBuilder::new(handle, "Help")
                .item(&settings_item)
                .item(&about_item)
                .build().unwrap();

            let menu = MenuBuilder::new(handle)
                .item(&file_menu)
                .item(&view_menu)
                .item(&help_menu)
                .build().unwrap();

            app.set_menu(menu).unwrap();

            app.on_menu_event(move |app_handle, event| match event.id().as_ref() {
                "app:quit" => app_handle.exit(0),
                id => {
                    app_handle.emit("menu-event", id).ok();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
