import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

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

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Customer = InferSelectModel<typeof customers> & {
    // For joined fields which are not in the table definition but returned by queries
    dept?: string | null;
    year?: string | null;
    categoryName?: string | null;
};
export type NewCustomer = InferInsertModel<typeof customers>;