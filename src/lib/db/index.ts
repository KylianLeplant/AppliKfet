import { drizzle } from "drizzle-orm/sqlite-proxy";
import Database from "@tauri-apps/plugin-sql";
import { appDataDir, join } from "@tauri-apps/api/path";
import { customers, categories, productsCategories, products, commande, type NewCustomer, type NewCommande, type NewProduct, type NewProductCategory, type NewCategory } from "./schema";
import * as schema from "./schema";
import { eq, sql } from "drizzle-orm";
import { seed } from "./seed";

// Fonction pour connecter Drizzle à Tauri SQL
const sqlite = await Database.load("sqlite:kfet.db");

// Log du chemin de la base de données
const appData = await appDataDir();
const dbPath = await join(appData, "kfet.db");
console.log("📂 Chemin de la base de données SQLite :", dbPath);

export const db = drizzle(async (sql, params, method) => {
  try {
    // Modifications (écriture)
    if (method === "run") {
        await sqlite.execute(sql, params);
        return { rows: [] };
    }

    // Lectures (SELECT)
    const rows = await sqlite.select<any[]>(sql, params);
    
    // DEBUG: On affiche ce que SQLite renvoie réellement
    if (rows.length > 0) {
        console.log("🔍 [DB PROXY] RAW DATA FROM SQLITE:", rows[0]);
    }

    // Pour Drizzle sqlite-proxy, la méthode la plus robuste est de renvoyer 
    // un tableau de tableaux de valeurs (any[][]). 
    // Drizzle se charge de remaper ces valeurs vers les objets JS selon son schéma.
    return { rows: rows.map(r => Object.values(r)) };
    
  } catch (e: any) {
    console.error("❌ DB PROXY ERROR:", e);
    return { rows: [] };
  }
}, { schema }); 

// Re-export schema for convenience
export * from "./schema";

export async function initDb() {
    // Dans Drizzle avec SQLite Proxy, la création de table auto est complexe sans migration.
    // On va utiliser des requêtes raw SQL pour créer les tables si elles n'existent pas
    // car 'drizzle-kit push' ne marche pas directement sur le fichier sqlite local via proxy en runtime.
    
    await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "dept" TEXT NOT NULL,
      "year" TEXT NOT NULL
    );
    `);

    await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "account" REAL DEFAULT 0,
      "isKfetier" INTEGER DEFAULT 0,
      "categoryId" INTEGER REFERENCES categories(id)
    );
    `);

    await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS productsCategories (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "imagePath" TEXT
    );
    `);

    await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS products (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "price" REAL NOT NULL,
      "priceForThree" REAL,
      "priceForKfetier" REAL NOT NULL,
      "priceForThreeKfetier" REAL,
      "categoryId" INTEGER REFERENCES productsCategories(id),
      "imagePath" TEXT
    );
    `);

    await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS commande (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "customerId" INTEGER REFERENCES customers(id),
      "productId" INTEGER REFERENCES products(id),
      "quantity" INTEGER NOT NULL,
      "totalPrice" REAL NOT NULL
    );
    `);

    await seed(db);
}

export async function resetDb() {
  console.log("Resetting database (dropping and creating tables)...");
  try {
    // Drop tables to clear everything (including potential schema mismatches)
    await sqlite.execute("DROP TABLE IF EXISTS commande;");
    await sqlite.execute("DROP TABLE IF EXISTS products;");
    await sqlite.execute("DROP TABLE IF EXISTS productsCategories;");
    await sqlite.execute("DROP TABLE IF EXISTS customers;");
    await sqlite.execute("DROP TABLE IF EXISTS categories;");
    
    // Re-initialize tables with the current schema
    await initDb();
    
    console.log("Database successfully reset and re-seeded.");
  } catch (error) {
    console.error("Error during database reset:", error);
    throw error;
  }
}

export async function getCustomers() {
  // Utilisation de Drizzle Query Builder avec jointure
  return await db.select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      account: customers.account,
      isKfetier: customers.isKfetier,
      categoryId: customers.categoryId,
      dept: categories.dept,
      year: categories.year,
      categoryName: categories.name
  })
  .from(customers)
  .leftJoin(categories, eq(customers.categoryId, categories.id))
  .all();
}

export async function getDepts() {
  const result = await db.select({ dept: categories.dept })
    .from(categories)
    .all();
  // On retourne une liste unique de départements
  return Array.from(new Set(result.map(r => r.dept))).filter(Boolean).sort();
}

export async function getYears() {
  const result = await db.select({ year: categories.year })
    .from(categories)
    .all();
  // On retourne une liste unique d'années
  return Array.from(new Set(result.map(r => r.year))).filter(Boolean).sort();
}

export async function getProductsCategories() {
  return await db.select().from(productsCategories).all();
}

export async function createProductCategory(data: NewProductCategory) {
  return await db.insert(productsCategories).values(data).all();
}

export async function updateProductCategory(id: number, data: Partial<NewProductCategory>) {
  return await db.update(productsCategories)
    .set(data)
    .where(eq(productsCategories.id, id))
    .all();
}

export async function deleteProductCategory(id: number) {
  return await db.delete(productsCategories).where(eq(productsCategories.id, id)).all();
}

export async function getProducts(ProductCategoryId?: number) {
  if (ProductCategoryId !== undefined) {
    return await db.select().from(products).where(eq(products.categoryId, ProductCategoryId)).all();
  }
  return await db.select().from(products).all();
}

export async function getCategories() {
  return await db.select().from(categories).all();
}

export async function createCategory(data: NewCategory) {
  return await db.insert(categories).values(data).all();
}

export async function updateCategory(id: number, data: Partial<NewCategory>) {
  return await db.update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .all();
}

export async function deleteCategory(id: number) {
  return await db.delete(categories).where(eq(categories.id, id)).all();
}

export async function createProduct(data: NewProduct) {
  return await db.insert(products).values(data).all();
}

export async function updateProduct(id: number, data: Partial<NewProduct>) {
  return await db.update(products)
    .set(data)
    .where(eq(products.id, id))
    .all();
}

export async function deleteProduct(id: number) {
  return await db.delete(products).where(eq(products.id, id)).all();
}

export async function createCommande(data: NewCommande) {
  // On insère d'abord la commande
  const result = await db.insert(commande)
    .values(data)
    .all();

  // Si on a un customerId et un prix, on met à jour son solde
  if (data.customerId && data.totalPrice !== undefined) {
      await db.update(customers)
        .set({
          account: sql`${customers.account} - ${data.totalPrice}`
        })
        .where(eq(customers.id, data.customerId))
        .all();
  }

  return result;
}

export async function updateCustomer(id: number, data: Partial<NewCustomer>) {
  return await db.update(customers)
    .set(data)
    .where(eq(customers.id, id))
    .all();
}
