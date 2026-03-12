mod commands;
mod db;
use commands::default::{read, write, save_image, read_old_db};
use db::{
    execute_batch_sql,
    execute_single_sql,
    AppState,
    Database,
    cleanup_old_backups,
};
use sqlx::{Pool, Row, Sqlite};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::Manager; // Important pour .manage()

fn resolve_shared_base_dir(user_app_data_dir: &Path) -> PathBuf {
    if cfg!(target_os = "windows") {
        std::env::var_os("PROGRAMDATA")
            .map_or_else(|| user_app_data_dir.to_path_buf(), PathBuf::from)
            .join("AppliKfet")
    } else {
        user_app_data_dir.to_path_buf()
    }
}

fn copy_dir_contents(source_dir: &Path, target_dir: &Path) -> Result<(), String> {
    if !source_dir.exists() {
        return Ok(());
    }

    fs::create_dir_all(target_dir).map_err(|e| e.to_string())?;

    for entry in fs::read_dir(source_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let source_path = entry.path();
        let target_path = target_dir.join(entry.file_name());

        if source_path.is_dir() {
            copy_dir_contents(&source_path, &target_path)?;
        } else if !target_path.exists() {
            fs::copy(&source_path, &target_path).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

fn sync_seed_images(app_handle: &tauri::AppHandle, image_root: &Path) -> Result<(), String> {
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;

    for folder in ["products", "products_categories"] {
        let target_dir = image_root.join(folder);
        fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

        let mut candidates = Vec::new();
        if let Ok(resource_dir) = app_handle.path().resource_dir() {
            candidates.push(resource_dir.join(folder));
        }
        candidates.push(current_dir.join("static").join(folder));
        if let Some(parent) = current_dir.parent() {
            candidates.push(parent.join("static").join(folder));
        }

        if let Some(source_dir) = candidates.into_iter().find(|candidate| candidate.exists()) {
            copy_dir_contents(&source_dir, &target_dir)?;
        }
    }

    Ok(())
}

fn normalize_seed_image_path(image_path: &str, image_root: &Path, folder: &str) -> Option<String> {
    let trimmed = image_path.trim();
    if trimmed.is_empty() || Path::new(trimmed).is_absolute() {
        return None;
    }

    let without_static = trimmed.strip_prefix("static/").unwrap_or(trimmed);
    let without_leading_slash = without_static.trim_start_matches(['/', '\\']);
    let folder_prefix = format!("{folder}/");
    let file_name = without_leading_slash.strip_prefix(&folder_prefix)?;

    Some(image_root.join(folder).join(file_name).to_string_lossy().into_owned())
}

async fn migrate_image_paths(pool: &Pool<Sqlite>, image_root: &Path) -> Result<(), String> {
    for (table, folder) in [
        ("products", "products"),
        ("productsCategories", "products_categories"),
    ] {
        let select_sql = format!(
            "SELECT id, imagePath FROM {table} WHERE imagePath IS NOT NULL AND imagePath != ''"
        );
        let update_sql = format!("UPDATE {table} SET imagePath = ? WHERE id = ?");

        for row in sqlx::query(&select_sql)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?
        {
            let id: i64 = row.try_get("id").map_err(|e| e.to_string())?;
            let image_path: String = row.try_get("imagePath").map_err(|e| e.to_string())?;

            if let Some(normalized_path) = normalize_seed_image_path(&image_path, image_root, folder) {
                sqlx::query(&update_sql)
                    .bind(normalized_path)
                    .bind(id)
                    .execute(pool)
                    .await
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}

#[allow(clippy::missing_panics_doc)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .plugin(tauri_plugin_sql::Builder::default().build()) 
        .setup(|app| {
            const THIRTY_DAYS_SECS: u64 = 30 * 24 * 60 * 60;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            let app_handle = app.handle();
            let user_app_data_dir = app_handle.path().app_data_dir().expect("failed to get app data dir");

            // Windows: prefer a machine-wide folder so all users share the same DB.
            let shared_base_dir = resolve_shared_base_dir(&user_app_data_dir);

            let shared_db_path = shared_base_dir.join("kfet_v2.db");
            let shared_backup_dir = shared_base_dir.join("backups");

            let fallback_db_path = user_app_data_dir.join("kfet_v2.db");
            let fallback_backup_dir = user_app_data_dir.join("backups");

            // Use shared path first, but fallback to per-user path if permissions are restricted.
            let (db_instance, db_path, backup_dir) = match tauri::async_runtime::block_on(async {
                Database::new(shared_db_path.clone()).await
            }) {
                Ok(db) => (db, shared_db_path, shared_backup_dir),
                Err(err) => {
                    eprintln!("Shared DB path unavailable ({err}). Falling back to user AppData.");
                    let db = tauri::async_runtime::block_on(async {
                        Database::new(fallback_db_path.clone()).await
                    })
                    .expect("failed to initialize database");
                    (db, fallback_db_path, fallback_backup_dir)
                }
            };

            // Cleanup backups older than 30 days
            if let Err(err) = cleanup_old_backups(&backup_dir, THIRTY_DAYS_SECS) {
                eprintln!("Backup cleanup failed: {err}");
            }

            if let Err(err) = db::backup_db_file_if_exists(&db_path, &backup_dir, "startup") {
                eprintln!("Startup DB backup failed: {err}");
            }

            let image_root = db_path
                .parent()
                .map_or_else(|| shared_base_dir.join("images"), |parent| parent.join("images"));

            if let Err(err) = sync_seed_images(&app_handle, &image_root) {
                eprintln!("Image sync failed: {err}");
            }

            if let Err(err) = tauri::async_runtime::block_on(migrate_image_paths(&db_instance.pool, &image_root)) {
                eprintln!("Image path migration failed: {err}");
            }

            app.manage(AppState {
                db: Arc::new(RwLock::new(Some(db_instance))),
                backup_dir,
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<AppState>();
                let db_state = state.db.clone();
                let backup_dir = state.backup_dir.clone();

                let backup_result = tauri::async_runtime::block_on(async {
                    let db_guard = db_state.read().await;
                    let db = db_guard
                        .as_ref()
                        .ok_or_else(|| "Database not initialized".to_string())?;

                    db::backup_db_with_vacuum(&db.pool, &backup_dir, "shutdown").await
                });

                if let Err(err) = backup_result {
                    eprintln!("Shutdown DB backup failed: {err}");
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            read, 
            write,
            save_image,
            read_old_db,
            execute_single_sql, 
            execute_batch_sql
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
