use super::errors::Error;
use std::fs;
use std::path::{Path, PathBuf};
use serde::Serialize;
use sqlx::FromRow;
use sqlx::sqlite::SqlitePoolOptions;
use tauri::Manager;

#[derive(Serialize, FromRow)]
pub struct OldClient {
    id: i64,
    nom: Option<String>,
    prenom: Option<String>,
    dette: Option<f64>,
    promo: Option<String>,
    droit: Option<String>,
}

#[tauri::command]
pub async fn read_old_db(path: String) -> Result<Vec<OldClient>, String> {
    if !std::path::Path::new(&path).exists() {
        return Err(format!("File not found: {path}"));
    }

    let pool = SqlitePoolOptions::new()
        .connect(&format!("sqlite://{path}"))
        .await
        .map_err(|e| e.to_string())?;

    let clients = sqlx::query_as::<_, OldClient>("SELECT id, nom, prenom, dette, promo, droit FROM Client")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(clients)
}

#[tauri::command]
pub fn read(path: String) -> Result<String, Error> {
    let data = fs::read(path)?;
    let string = String::from_utf8(data)?;
    Ok(string)
}

#[tauri::command]
pub fn write(path: String, contents: String) -> Result<(), Error> {
    fs::write(path, contents)?;
    Ok(())
}

#[tauri::command]
pub fn save_image(app: tauri::AppHandle, folder: &str, filename: &str, content: Vec<u8>) -> Result<String, String> {
    let user_app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let base_dir = if cfg!(target_os = "windows") {
        std::env::var_os("PROGRAMDATA")
            .map_or_else(|| user_app_data_dir.clone(), PathBuf::from)
            .join("AppliKfet")
    } else {
        user_app_data_dir
    };

    let safe_filename = Path::new(filename)
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Nom de fichier invalide".to_string())?;

    let folder_path = base_dir.join("images").join(folder);
    fs::create_dir_all(&folder_path).map_err(|e| e.to_string())?;

    let file_path = folder_path.join(safe_filename);

    if file_path.exists() {
        return Err(format!("Le fichier '{safe_filename}' existe déjà dans le dossier '{folder}'"));
    }

    fs::write(&file_path, content).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().into_owned())
}
