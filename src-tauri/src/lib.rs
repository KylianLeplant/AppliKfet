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
            let app_data_dir = app_handle.path().app_data_dir().expect("failed to get app data dir");
            let db_path = app_data_dir.join("kfet_v2.db");
            let backup_dir = app_data_dir.join("backups");

            // Cleanup backups older than 30 days
            if let Err(err) = cleanup_old_backups(&backup_dir, THIRTY_DAYS_SECS) {
                eprintln!("Backup cleanup failed: {err}");
            }

            if let Err(err) = db::backup_db_file_if_exists(&db_path, &backup_dir, "startup") {
                eprintln!("Startup DB backup failed: {err}");
            }

            let db_instance = tauri::async_runtime::block_on(async {
                Database::new(db_path).await
            }).expect("failed to initialize database");

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
