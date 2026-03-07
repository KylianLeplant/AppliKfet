/// <reference types="bun" />
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { customers, categories, productsCategories, products } from "../src/lib/db/schema";
import { join } from "path";
import { existsSync } from "fs";
import { homedir } from "os";


// 1. Locate the OLD database
// Priority: Command line arg > Env var > Default
const args = process.argv.slice(2);
const oldDbPath = args[0] || process.env.OLD_DB_PATH || join(homedir(), "Downloads", "kfet.sqlite");

if (!args[0]) {
    console.log("ℹ️ Info: You can provide the DB path as an argument: bun scripts/import_old_db.ts <path>");
    console.log(`ℹ Using path: ${oldDbPath}`);
}

// 2. Locate the NEW database (Tauri app data)
// Identifier from tauri.conf.json: com.tauri2-svelte5-shadcn.dev
// Windows: %APPDATA%/com.tauri2-svelte5-shadcn.dev/kfet_v2.db
const appData = process.env.APPDATA || process.env.HOME || ""; // Fallback
const identifier = "com.tauri2-svelte5-shadcn.dev";
const newDbPath = process.env.NEW_DB_PATH || join(appData, identifier, "kfet_v2.db");

console.log(`📂 Source (Old DB): ${oldDbPath}`);
console.log(`📂 Destination (New DB): ${newDbPath}`);

if (!existsSync(oldDbPath)) {
    console.error(`❌ Old DB not found at: ${oldDbPath}`);
    process.exit(1);
}

if (!existsSync(newDbPath)) {
    console.error(`❌ New DB not found at: ${newDbPath}`);
    console.error("💡 Please run the app once first (nun run tauri dev) to create the database structure.");
    process.exit(1);
}


// Connect
const oldSqlite = new Database(oldDbPath);
const newSqlite = new Database(newDbPath, { create: true });
const db = drizzle(newSqlite);

// Interface for old client
interface OldClient {
    id: number;
    nom: string | null;
    prenom: string | null;
    dette: number | null;
    promo: string | null;
    droit: string | null;
}

// Ensure tables exist
const run = newSqlite.run.bind(newSqlite);
async function initTables() {
    console.log("🛠️ Ensuring tables exist...");
    
    // Categories table with unique constraint on name
    run(`
        CREATE TABLE IF NOT EXISTS categories (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL UNIQUE,
          "dept" TEXT NOT NULL,
          "year" TEXT,
          "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // The other tables (simplified for migration, though ideally we should run full init logic)
    run(`
        CREATE TABLE IF NOT EXISTS customers (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "account" REAL DEFAULT 0,
          "isKfetier" INTEGER DEFAULT 0,
          "categoryId" INTEGER REFERENCES categories(id),
          "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

async function seedCategories() {
    console.log("🌱 Seeding categories if missing...");
    const depts = ["DI", "DA", "DEE", "DMS", "ISIE", "MMA"];
    const years = ["3A", "4A", "5A"];
    
    // Insert base categories
    for (const dept of depts) {
        for (const year of years) {
            const name = `${dept} ${year}`;
            try {
                // Manually insert via SQL to avoid TS complexity with drizzle-orm insert ignore
                run(`INSERT OR IGNORE INTO categories (name, dept, year) VALUES (?, ?, ?)`, [name, dept, year]);
            } catch (e: any) {
                // Ignore unique constraint violation
            }
        }
    }
    
    const singles = [
         {name: "PeiP1", dept: "PeiP", year: "PeiP1"},
         {name: "PeiP2", dept: "PeiP", year: "PeiP2"},
         {name: "Prof", dept: "Prof", year: null},
         {name: "Autre", dept: "Autre", year: null},
         {name: "DA sans classe", dept: "DA", year: null},
         {name: "ISIE sans classe", dept: "ISIE", year: null},
         {name: "MMA sans classe", dept: "MMA", year: null},
         {name: "DMS sans classe", dept: "DMS", year: null},
         {name: "Anciens élèves", dept: "Anciens élèves", year: null},
         {name: "PeiP sans classe", dept: "PeiP", year: null},
         {name: "KFetier", dept: "KFetier", year: null},
         {name: "Save", dept: "Save", year: null}
    ];

    for (const s of singles) {
        try {
            run(`INSERT OR IGNORE INTO categories (name, dept, year) VALUES (?, ?, ?)`, [s.name, s.dept, s.year]);
        } catch (e: any) {
             // Ignore unique constraint violation
        }
    }
}


async function runMigration() {
    console.log("🚀 Starting migration...");

    // Init DB structure
    await initTables();

    // Seed categories first!
    await seedCategories();
    
    // Note: If you want to see if categories were created, check here
    // const check = await db.select().from(categories);
    // console.log(`Categories count: ${check.length}`);

    // 1. Read old clients
    const query = oldSqlite.query("SELECT * FROM Client");
    const oldClients = query.all() as OldClient[];
    
    if (!oldClients.length) {
        console.log("⚠️ No clients found in old DB.");
        return;
    }
    console.log(`Found ${oldClients.length} clients to migrate.`);

    // 2. Load categories from new DB for mapping
    // We assume the app has run 'seed' at least once, so base categories exist.
    // Note: If categories table is empty because app never ran seed logic, this might fail logic-wise.
    const existingCats = await db.select().from(categories);
    const catMap = new Map<string, number>();
    for (const cat of existingCats) {
        catMap.set(cat.name, cat.id);
    }
    
    const getCategoryId = (promo: string | null): number | null => {
        if (!promo) return null;
        const p = promo.trim();
        // Rules
        if (p === "DI3") return catMap.get("DI 3A") ?? null;
        if (p === "DI4") return catMap.get("DI 4A") ?? null;
        if (p === "DI5") return catMap.get("DI 5A") ?? null;
        if (p === "DII") return catMap.get("ISIE sans classe") ?? null;
        if (p === "DMS") return catMap.get("DMS sans classe") ?? null;
        if (p === "DA") return catMap.get("DA sans classe") ?? null;
        if (p === "Peip") return catMap.get("Peip sans classe") ?? null;
        if (p === "Save") return catMap.get("Save") ?? null;
        if (p === "Autre") return catMap.get("Autre") ?? null;
        if (p === "DI6") return catMap.get("Save") ?? null;
        if (p === "KFtier") return catMap.get("KFetier") ?? null;
        return null; 
    };

    const newCustomers: any[] = [];

    for (const client of oldClients) {
        const catId = getCategoryId(client.promo);
        const isKFetier = client.promo?.trim() === "KFtier";
        
        newCustomers.push({
            firstName: client.prenom || "",
            lastName: client.nom || "",
            account: client.dette || 0,
            categoryId: catId,
            isKfetier: isKFetier ? 1 : 0 // SQLite doesn't have boolean, using INTEGER 0/1
        });
    }
    
    // Check if newCustomers already exist to prevent duplicate?
    // User didn't ask for idempotency, just "rajoutes un nouveau client".
    // Might duplicate if run twice. I'll add a check for firstname/lastname just in case?
    // No, user specifically asked to "rajoutes un nouveau client". I will conform.

    // Batch insert in chunks to keep it clean
    const chunkSize = 50;
    for (let i = 0; i < newCustomers.length; i += chunkSize) {
        const chunk = newCustomers.slice(i, i + chunkSize);
        try {
            await db.insert(customers).values(chunk);
            process.stdout.write(".");
        } catch (e) {
            console.error(`\n❌ Error inserting chunk ${i}:`, e);
        }
    }

    seedProducts();

    console.log(`\n✅ Done! Migrated ${newCustomers.length} clients.`);
}

async function seedProducts() {
    console.log("🌱 Seeding products...");
    try {
        const existingProductsCats = await db.select().from(productsCategories);
        if (existingProductsCats.length === 0) {
            console.log("Seeding sample product categories...");
            const sampleProductCategories = [
                { name: "Boissons", imagePath: "static/products_categories/boissons.png" },
                { name: "Snacks", imagePath: "static/products_categories/snacks.webp" },
                { name: "Midi", imagePath: "static/products_categories/pizza.webp" },
                { name: "St-Michel", imagePath: "static/products_categories/st_michel.png" },
                { name: "suppléments", imagePath: null }
            ];
            for (const cat of sampleProductCategories) {
                await db.insert(productsCategories).values(cat);
            }
            console.log("Product categories seeded OK.");
        }
    } catch (e) {
        console.error("❌ Seed Product Categories error:", e);
    }

    try {
        const existingProducts = await db.select().from(products);
        if (existingProducts.length === 0) {
            console.log("Seeding sample products...");
            const allProductCats: any[] = await db.select().from(productsCategories);
            const sampleProducts = [
                { name: "Breizh-Cola", price: 1.5, priceForThree: 4.0, priceForKfetier: 1.2, priceForThreeKfetier: 3.5, categoryId: allProductCats.find(c => c.name === "Boissons")?.id, imagePath: "static/products/breizh_cola.jpeg" },
                { name: "Pizza", price: 3, priceForThree: null, priceForKfetier: 2.8, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "Midi")?.id, imagePath: "static/products/pizza.webp" },
                { name: "Croques-monsieur x2", price: 1.6, priceForThree: null, priceForKfetier: 1.4, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "Midi")?.id, imagePath: "static/products/croque_monsieur.png" },
                { name: "Croques-monsieur x4", price: 3, priceForThree: null, priceForKfetier: 2.8, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "Midi")?.id, imagePath: "static/products/croque_monsieur.png" },
                { name: "Eau Minérale", price: 0.5, priceForThree: null, priceForKfetier: 0.5, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "Boissons")?.id, imagePath: "static/products/eau.jpg" },
                { name: "Madeleine nature", price: 0.2, priceForThree: 0.5, priceForKfetier: 0.15, priceForThreeKfetier: 0.45, categoryId: allProductCats.find(c => c.name === "St-Michel")?.id, imagePath: "static/products/madeleines.jfif" },
                { name: "Madeleines chocolat", price: 0.3, priceForThree: 0.8, priceForKfetier: 0.25, priceForThreeKfetier: 0.7, categoryId: allProductCats.find(c => c.name === "St-Michel")?.id, imagePath: "static/products/madeleines choco.jpg" },
                { name: "Brownies", price: 2.0, priceForThree: null, priceForKfetier: 1.5, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "St-Michel")?.id, imagePath: "static/products/brownies.jpg" },
                { name: "Kinder Bueno", price: 0.8, priceForThree: null, priceForKfetier: 0.7, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "Snacks")?.id, imagePath: "static/products/kinder bueno.webp" },
                { name: "M&M's", price: 0.6, priceForThree: null, priceForKfetier: 0.5, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "Snacks")?.id, imagePath: "static/products/M&Ms.jpg" },
                { name: "Barre de céréales", price: 1.0, priceForThree: null, priceForKfetier: 0.8, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "Snacks")?.id, imagePath: null },
                { name: "Supplément poivrons", price: 0.5, priceForThree: null, priceForKfetier: 0.4, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "suppléments")?.id, imagePath: null },
                { name: "Supplément oignons", price: 0.5, priceForThree: null, priceForKfetier: 0.4, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "suppléments")?.id, imagePath: null },
                { name: "Supplément champignons", price: 0.5, priceForThree: null, priceForKfetier: 0.4, priceForThreeKfetier: null, categoryId: allProductCats.find(c => c.name === "suppléments")?.id, imagePath: null }
            ];
            for (const prod of sampleProducts) {
                await db.insert(products).values(prod);
            }
            console.log("Products seeded OK.");
        }
    } catch (e) {
        console.error("❌ Seed Products error:", e);
    }
}

runMigration().catch(e => console.error(e));
