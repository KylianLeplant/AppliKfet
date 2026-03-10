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
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::Manager; // Important pour .manage()

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
            let shared_base_dir = if cfg!(target_os = "windows") {
                std::env::var_os("PROGRAMDATA")
                    .map_or_else(|| user_app_data_dir.clone(), PathBuf::from)
                    .join("AppliKfet")
            } else {
                user_app_data_dir.clone()
            };

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
