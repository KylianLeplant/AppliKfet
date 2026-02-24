mod commands;
mod db; 
use commands::default::{read, write, save_image};
use db::{execute_single_sql, execute_batch_sql, Database, AppState};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::Manager; // Important pour .manage()

#[allow(clippy::missing_panics_doc)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .plugin(tauri_plugin_sql::Builder::default().build()) 
        .setup(|app| {
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
            
            let db_instance = tauri::async_runtime::block_on(async {
                Database::new(db_path).await
            }).expect("failed to initialize database");
            
            app.manage(AppState {
                db: Arc::new(RwLock::new(Some(db_instance))),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read, 
            write,
            save_image,
            execute_single_sql, 
            execute_batch_sql
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
