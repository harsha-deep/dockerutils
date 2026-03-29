// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;
use tauri::menu::{MenuBuilder, MenuItem, SubmenuBuilder};
use tauri::Emitter;

#[tauri::command]
fn docker_ps() -> Result<Vec<serde_json::Value>, String> {
    let output = Command::new("docker")
        .args(["ps", "-a", "--format", "{{json .}}"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let containers = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(containers)
}

#[tauri::command]
fn docker_images() -> Result<Vec<serde_json::Value>, String> {
    let output = Command::new("docker")
        .args(["images", "--format", "{{json .}}"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let images = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(images)
}

#[tauri::command]
fn docker_services() -> Result<Vec<serde_json::Value>, String> {
    let output = Command::new("docker")
        .args(["service", "ls", "--format", "{{json .}}"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let services = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(services)
}

#[tauri::command]
fn docker_stop_container(name: String) -> Result<String, String> {
    let clean = name.trim_start_matches('/').to_string();
    let output = Command::new("docker")
        .args(["stop", &clean])
        .output()
        .map_err(|e| e.to_string())?;
    print!("Output: {:?}", output);
    if output.status.success() {
        Ok(clean)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
fn docker_remove_container(name: String) -> Result<String, String> {
    let clean = name.trim_start_matches('/').to_string();
    let output = Command::new("docker")
        .args(["rm", &clean])
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(clean)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
fn docker_start_container(name: String) -> Result<String, String> {
    let clean = name.trim_start_matches('/').to_string();
    let output = Command::new("docker")
        .args(["start", &clean])
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(clean)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
fn docker_delete_image(id: String) -> Result<String, String> {
    let output = Command::new("docker")
        .args(["rmi", &id])
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(id)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
fn docker_compose_stop_service(path: String, service: String) -> Result<String, String> {
    let output = Command::new("docker")
        .args(["compose", "stop", &service])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(service)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
fn docker_compose_remove_service(path: String, service: String) -> Result<String, String> {
    let output = Command::new("docker")
        .args(["compose", "rm", "-f", &service])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(service)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            docker_ps,
            docker_images,
            docker_services,
            docker_stop_container,
            docker_start_container,
            docker_remove_container,
            docker_delete_image,
            docker_compose_stop_service,
            docker_compose_remove_service
        ])
        .setup(|app| {
            let handle = app.handle();

            // --- View menu items ---
            let images_item =
                MenuItem::with_id(handle, "nav:images", "Images", true, Some("CmdOrCtrl+1"))?;
            let containers_item = MenuItem::with_id(
                handle,
                "nav:containers",
                "Containers",
                true,
                Some("CmdOrCtrl+2"),
            )?;
            let services_item = MenuItem::with_id(
                handle,
                "nav:services",
                "Services",
                true,
                Some("CmdOrCtrl+3"),
            )?;
            let refresh_item = MenuItem::with_id(
                handle,
                "action:refresh",
                "Refresh",
                true,
                Some("CmdOrCtrl+R"),
            )?;

            // --- File menu ---
            let quit_item =
                MenuItem::with_id(handle, "app:quit", "Quit", true, Some("CmdOrCtrl+Q"))?;
            let file_menu = SubmenuBuilder::new(handle, "File")
                .item(&quit_item)
                .build()?;

            // --- View menu ---
            let view_menu = SubmenuBuilder::new(handle, "View")
                .item(&images_item)
                .item(&containers_item)
                .item(&services_item)
                .separator()
                .item(&refresh_item)
                .build()?;

            // --- Help/App menu items ---
            let settings_item = MenuItem::with_id(
                handle,
                "app:settings",
                "Settings",
                true,
                Some("CmdOrCtrl+,"),
            )?;
            let about_item =
                MenuItem::with_id(handle, "app:about", "About DockerUtils", true, None::<&str>)?;

            // --- Help menu ---
            let help_menu = SubmenuBuilder::new(handle, "Help")
                .item(&settings_item)
                .item(&about_item)
                .build()?;

            // --- Main menu ---
            let menu = MenuBuilder::new(handle)
                .item(&file_menu)
                .item(&view_menu)
                .item(&help_menu)
                .build()?;

            app.set_menu(menu)?;

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
