import { drizzle } from "drizzle-orm/sqlite-proxy";
import { invoke } from "@tauri-apps/api/core";
import { customers, categories, productsCategories, products, commande, type NewCustomer, type NewCommande, type NewProduct, type NewProductCategory, type NewCategory } from "./schema";
import * as schema from "./schema";
import { eq, sql } from "drizzle-orm";
import { seed } from "./seed";

// Configuration de la connexion Drizzle via Tauri Commands (Rust SQLx)
export const db = drizzle(
  // 1. Gestion des requêtes simples
  async (sql, params, method) => {
    try {
      // Appel de la commande Rust 'execute_single_sql'
      const rows = await invoke<any[][]>('execute_single_sql', {
        sql,
        params
      });
      
      // Drizzle attend un objet { rows: ... }
      return { rows: rows };
    } catch (e: any) {
      console.error("❌ SQL ERROR (Single):", e);
      throw e;
    }
  },
  // 2. Gestion des requêtes en BATCH (Transactions)
  async (queries) => {
    try {
      // Appel de la commande Rust 'execute_batch_sql'
      // queries est un tableau de { sql, params, method }
      const results = await invoke<any[][][]>('execute_batch_sql', {
        queries
      });
      
      // On doit mapper chaque résultat pour Drizzle
      return results.map(rows => ({ rows }));
    } catch (e: any) {
       console.error("❌ SQL ERROR (Batch):", e);
       throw e;
    }
  },
  { schema }
);

// Re-export schema for convenience
export * from "./schema";

export async function initDb() {
    // Initialisation via des requêtes SQL directes via le proxy
    try {
        await db.run(sql`
        CREATE TABLE IF NOT EXISTS categories (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL,
          "dept" TEXT NOT NULL,
          "year" TEXT NOT NULL
        );
        `);

        await db.run(sql`
        CREATE TABLE IF NOT EXISTS customers (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "account" REAL DEFAULT 0,
          "isKfetier" INTEGER DEFAULT 0,
          "categoryId" INTEGER REFERENCES categories(id)
        );
        `);

        await db.run(sql`
        CREATE TABLE IF NOT EXISTS productsCategories (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL,
          "imagePath" TEXT
        );
        `);

        await db.run(sql`
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

        await db.run(sql`
        CREATE TABLE IF NOT EXISTS commande (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "customerId" INTEGER REFERENCES customers(id),
          "productId" INTEGER REFERENCES products(id),
          "quantity" INTEGER NOT NULL,
          "totalPrice" REAL NOT NULL
        );
        `);

        await seed(db);
    } catch (e) {
        console.error("Failed to init DB:", e);
    }
}


export async function resetDb() {
  console.log("Resetting database (dropping and creating tables)...");
  try {
     // Exécution séquentielle pour éviter les erreurs de typage avec db.batch([sql`...`])
     await db.run(sql`DROP TABLE IF EXISTS commande;`);
     await db.run(sql`DROP TABLE IF EXISTS products;`);
     await db.run(sql`DROP TABLE IF EXISTS productsCategories;`);
     await db.run(sql`DROP TABLE IF EXISTS customers;`);
     await db.run(sql`DROP TABLE IF EXISTS categories;`);
    
    // Re-initialize tables
    await initDb();
    
    console.log("Database successfully reset and re-seeded.");
  } catch (error) {
    console.error("Error during database reset:", error);
    throw error;
  }
}

export async function getCustomers() {
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
  return Array.from(new Set(result.map(r => r.dept))).filter(Boolean).sort();
}

export async function getYears() {
  const result = await db.select({ year: categories.year })
    .from(categories)
    .all();
  return Array.from(new Set(result.map(r => r.year))).filter(Boolean).sort();
}

export async function getProductsCategories() {
  return await db.select().from(productsCategories).all();
}

export async function createProductCategory(data: NewProductCategory) {
  return await db.insert(productsCategories).values(data);
}

export async function updateProductCategory(id: number, data: Partial<NewProductCategory>) {
  return await db.update(productsCategories)
    .set(data)
    .where(eq(productsCategories.id, id));
}

export async function deleteProductCategory(id: number) {
  return await db.delete(productsCategories).where(eq(productsCategories.id, id));
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
  return await db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<NewCategory>) {
  return await db.update(categories)
    .set(data)
    .where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  return await db.delete(categories).where(eq(categories.id, id));
}

export async function createProduct(data: NewProduct) {
  return await db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<NewProduct>) {
  return await db.update(products)
    .set(data)
    .where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  return await db.delete(products).where(eq(products.id, id));
}

export async function createCommande(data: NewCommande) {
  if (data.customerId && data.totalPrice !== undefined) {
      // Transaction atomique via l'API Batch de Drizzle Proxy
      const batchResult = await db.batch([
        db.insert(commande).values(data),
        db.update(customers)
          .set({
            account: sql`${customers.account} - ${data.totalPrice}`
          })
          .where(eq(customers.id, data.customerId))
      ]);
      // On retourne le résultat pertinent
      return batchResult; 
  } else {
      return await db.insert(commande).values(data);
  }
}

export async function updateCustomer(id: number, data: Partial<NewCustomer>) {
  return await db.update(customers)
    .set(data)
    .where(eq(customers.id, id));
}

export async function addMoneyToCustomer(id: number, amount: number) {
  return await db.update(customers)
    .set({
      account: sql`${customers.account} + ${amount}`
    })
    .where(eq(customers.id, id));
}
