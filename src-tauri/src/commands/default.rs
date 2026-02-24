use super::errors::Error;
use std::fs;

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
pub fn save_image(folder: String, filename: String, content: Vec<u8>) -> Result<String, String> {
    // Try to find the static directory relative to where we are running
    // In dev: likely need to go up one level from src-tauri
    // But let's check current dir first
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    
    // Attempt to locate "static" folder
    let mut target_dir = current_dir.clone();
    
    // Strategy: Look for "static" in current dir, or parent, or parent's parent
    if !target_dir.join("static").exists() {
        if let Some(parent) = target_dir.parent() {
            target_dir = parent.to_path_buf();
        }
    }
    
    if !target_dir.join("static").exists() {
        return Err(format!("Impossible de trouver le dossier 'static' depuis {:?}", current_dir));
    }
    
    let folder_path = target_dir.join("static").join(&folder);
    
    // Create folder if not exists (though user said it should be associated folder, assume exists or create)
    if !folder_path.exists() {
         fs::create_dir_all(&folder_path).map_err(|e| e.to_string())?;
    }
    
    let file_path = folder_path.join(&filename);
    
    if file_path.exists() {
        return Err(format!("Le fichier '{}' existe déjà dans le dossier '{}'", filename, folder));
    }
    
    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    
    // Return relative path including "static/" if that's what's expected for display
    // e.g. "static/products/image.png"
    Ok(format!("static/{}/{}", folder, filename))
}
