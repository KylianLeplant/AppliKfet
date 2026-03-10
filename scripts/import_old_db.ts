/// <reference types="bun" />
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { customers, categories, productsCategories, products } from "../src/lib/db/schema";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";


// 1. Locate the OLD database
// Priority: Command line arg > Env var > Default
const args = process.argv.slice(2);
const oldDbPath = args[0] || process.env.OLD_DB_PATH || join(homedir(), "Downloads", "kfet.sqlite");

if (!args[0]) {
    console.log("ℹ️ Info: You can provide the DB path as an argument: bun scripts/import_old_db.ts <path>");
    console.log(`ℹ Using path: ${oldDbPath}`);
}

// 2. Locate the NEW database
// Priority: NEW_DB_PATH > shared ProgramData (Windows) > per-user AppData fallback
const appData = process.env.APPDATA || process.env.HOME || "";
const programData = process.env.PROGRAMDATA;
const defaultNewDbPath = programData
    ? join(programData, "AppliKfet", "kfet_v2.db")
    : join(appData, "com.tauri2-svelte5-shadcn.dev", "kfet_v2.db");
const newDbPath = process.env.NEW_DB_PATH || defaultNewDbPath;

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

interface CategorySingleSeed {
    name: string;
    dept: string;
    year: string | null;
}

interface ProductCategorySeed {
    name: string;
    imagePath: string | null;
}

interface ProductSeed {
    name: string;
    price: number;
    priceForThree: number | null;
    priceForKfetier: number;
    priceForThreeKfetier: number | null;
    categoryName: string;
    imagePath: string | null;
}

function readSeedJson<T>(fileName: string): T {
    const filePath = join(import.meta.dir, "seed-data", fileName);
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

const seededDepts = readSeedJson<string[]>("category-depts.json");
const seededYears = readSeedJson<string[]>("category-years.json");
const seededCategorySingles = readSeedJson<CategorySingleSeed[]>("category-singles.json");
const seededProductCategories = readSeedJson<ProductCategorySeed[]>("product-categories.json");
const seededProducts = readSeedJson<ProductSeed[]>("products.json");

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
    
    // Insert base categories
    for (const dept of seededDepts) {
        for (const year of seededYears) {
            const name = `${dept} ${year}`;
            try {
                // Manually insert via SQL to avoid TS complexity with drizzle-orm insert ignore
                run(`INSERT OR IGNORE INTO categories (name, dept, year) VALUES (?, ?, ?)`, [name, dept, year]);
            } catch (e: any) {
                // Ignore unique constraint violation
            }
        }
    }

    for (const s of seededCategorySingles) {
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
            for (const cat of seededProductCategories) {
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
            const categoryIdByName = new Map<string, number>(
                allProductCats.map((cat) => [cat.name, cat.id])
            );

            for (const prod of seededProducts) {
                await db.insert(products).values({
                    name: prod.name,
                    price: prod.price,
                    priceForThree: prod.priceForThree,
                    priceForKfetier: prod.priceForKfetier,
                    priceForThreeKfetier: prod.priceForThreeKfetier,
                    categoryId: categoryIdByName.get(prod.categoryName),
                    imagePath: prod.imagePath
                });
            }
            console.log("Products seeded OK.");
        }
    } catch (e) {
        console.error("❌ Seed Products error:", e);
    }
}

runMigration().catch(e => console.error(e));
