use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Pool, Sqlite};
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct Database {
    pub pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(db_path: PathBuf) -> Result<Self, String> {
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let connect_options = SqliteConnectOptions::from_str(db_path.to_str().unwrap())
            .map_err(|e| e.to_string())?
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .connect_with(connect_options)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Self { pool })
    }
}

pub struct AppState {
    pub db: Arc<RwLock<Option<Database>>>,
}

#[derive(serde::Deserialize)]
pub struct BatchItem {
    pub sql: String,
    pub params: Vec<serde_json::Value>,
    #[allow(dead_code)]
    pub method: String,
}

#[tauri::command]
pub async fn execute_single_sql(
    state: tauri::State<'_, AppState>,
    sql: String,
    params: Vec<serde_json::Value>,
) -> Result<Vec<Vec<serde_json::Value>>, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;

    let mut query_builder = sqlx::query(&sql);
    
    for param in params {
        match param {
            serde_json::Value::Null => query_builder = query_builder.bind(Option::<String>::None),
            serde_json::Value::Bool(b) => query_builder = query_builder.bind(b),
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    query_builder = query_builder.bind(i);
                } else if let Some(f) = n.as_f64() {
                    query_builder = query_builder.bind(f);
                } else {
                     query_builder = query_builder.bind(n.to_string());
                }
            },
            serde_json::Value::String(s) => query_builder = query_builder.bind(s),
            _ => query_builder = query_builder.bind(param.to_string()), // Fallback pour Array/Object
        }
    }

    // On utilise fetch_all pour récupérer les résultats
    let rows = query_builder.fetch_all(&db.pool).await.map_err(|e| e.to_string())?;

    let mut result_rows = Vec::new();
    
    if rows.is_empty() {
        return Ok(vec![]);
    }
    
    for row in rows {
        use sqlx::Row;
        use sqlx::Column;
        
        let mut row_values = Vec::new();
        for col in row.columns() {
            let val: serde_json::Value = if let Ok(v) = row.try_get::<i64, _>(col.ordinal()) {
                serde_json::Value::Number(v.into())
            } else if let Ok(v) = row.try_get::<f64, _>(col.ordinal()) {
                 if let Some(n) = serde_json::Number::from_f64(v) {
                    serde_json::Value::Number(n)
                 } else {
                    serde_json::Value::Null
                 }
            } else if let Ok(v) = row.try_get::<String, _>(col.ordinal()) {
                serde_json::Value::String(v)
            } else if let Ok(v) = row.try_get::<bool, _>(col.ordinal()) {
                serde_json::Value::Bool(v)
            } else {
                serde_json::Value::Null
            };
            
            row_values.push(val);
        }
        result_rows.push(row_values);
    }

    Ok(result_rows)
}

#[tauri::command]
pub async fn execute_batch_sql(
    state: tauri::State<'_, AppState>,
    queries: Vec<BatchItem>,
) -> Result<Vec<Vec<Vec<serde_json::Value>>>, String> {
    let db_guard = state.db.read().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;

    let mut tx = db.pool.begin().await.map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();

    for query in queries {
        let mut query_builder = sqlx::query(&query.sql);
        
        for param in query.params {
            match param {
                serde_json::Value::Null => query_builder = query_builder.bind(Option::<String>::None),
                serde_json::Value::Bool(b) => query_builder = query_builder.bind(b),
                serde_json::Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        query_builder = query_builder.bind(i);
                    } else if let Some(f) = n.as_f64() {
                        query_builder = query_builder.bind(f);
                    } else {
                         query_builder = query_builder.bind(n.to_string());
                    }
                },
                serde_json::Value::String(s) => query_builder = query_builder.bind(s),
                _ => query_builder = query_builder.bind(param.to_string()),
            }
        }

        // On exécute dans la transaction
        let rows = query_builder.fetch_all(&mut *tx).await.map_err(|e| e.to_string())?;

        // Mappage des résultats (copié depuis execute_single_sql)
        let mut result_rows = Vec::new();
        for row in rows {
            use sqlx::Row;
            use sqlx::Column;
            let mut row_values = Vec::new();
            for col in row.columns() {
                let val: serde_json::Value = if let Ok(v) = row.try_get::<i64, _>(col.ordinal()) {
                    serde_json::Value::Number(v.into())
                } else if let Ok(v) = row.try_get::<f64, _>(col.ordinal()) {
                     if let Some(n) = serde_json::Number::from_f64(v) {
                        serde_json::Value::Number(n)
                     } else {
                        serde_json::Value::Null
                     }
                } else if let Ok(v) = row.try_get::<String, _>(col.ordinal()) {
                    serde_json::Value::String(v)
                } else if let Ok(v) = row.try_get::<bool, _>(col.ordinal()) {
                    serde_json::Value::Bool(v)
                } else {
                    serde_json::Value::Null
                };
                row_values.push(val);
            }
            result_rows.push(row_values);
        }
        results.push(result_rows);
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(results)
}
