import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { image } from "@tauri-apps/api";

export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    dept: text("dept").notNull(),
    year: text("year").notNull()
});

export const customers = sqliteTable("customers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    firstName: text("firstName").notNull(),
    lastName: text("lastName").notNull(),
    account: real("account").default(0),
    isKfetier: integer("isKfetier", { mode: "boolean" }).default(false), 
    categoryId: integer("categoryId").references(() => categories.id)
});

export const productsCategories = sqliteTable("productsCategories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    imagePath: text("imagePath")
});

export const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    price: real("price").notNull(),
    priceForThree: real("priceForThree"),
    priceForKfetier: real("priceForKfetier").notNull(),
    priceForThreeKfetier: real("priceForThreeKfetier"),
    categoryId: integer("categoryId").references(() => productsCategories.id),
    imagePath: text("imagePath")
});

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Customer = InferSelectModel<typeof customers> & {
    // For joined fields which are not in the table definition but returned by queries
    dept?: string | null;
    year?: string | null;
    categoryName?: string | null;
};
export type NewCustomer = InferInsertModel<typeof customers>;

export type ProductCategory = InferSelectModel<typeof productsCategories>;
export type NewProductCategory = InferInsertModel<typeof productsCategories>;

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;