import { Database } from 'bun:sqlite';
const db = new Database('C:/ProgramData/AppliKfet/kfet_v2.db');
db.query(\"UPDATE products SET imagePath = REPLACE(imagePath, 'static/', '/')\").run();
db.query(\"UPDATE productsCategories SET imagePath = REPLACE(imagePath, 'static/', '/')\").run();
console.log('Done!');
