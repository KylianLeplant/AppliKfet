import { categories, customers } from "./schema";
import { eq } from "drizzle-orm";

export async function seed(db: any) {
    console.log("🌱 Starting seed...");
    
    try {
        const existingCats = await db.select().from(categories);
        console.log(`Checking cats: found ${existingCats.length}`);
        
        if (existingCats.length === 0) {
            console.log("Seeding base categories...");
            const depts = ["DI", "DA", "DEE", "DMS"];
            const years = ["3A", "4A", "5A"];
            
            for (const dept of depts) {
                for (const year of years) {
                    await db.insert(categories).values({
                        name: `${dept} ${year}`,
                        dept,
                        year
                    });
                }
            }
            console.log("Categories seeded OK.");
        }
    } catch (e) {
        console.error("❌ Seed Categories error:", e);
    }

    try {
        const existingCusts = await db.select().from(customers);
        console.log(`Checking customers: found ${existingCusts.length}`);

        if (existingCusts.length === 0) {
            console.log("Seeding sample customers...");
            const allCategories: any[] = await db.select().from(categories);
            console.log("DEBUG FIRST CAT:", allCategories[0]);
            
            if (allCategories.length > 0) {
                const sampleCustomers = [
                    { firstName: "Jean", lastName: "Dupont", account: 10.5, isKfetier: false },
                    { firstName: "Marie", lastName: "Curie", account: 25.0, isKfetier: true },
                    { firstName: "Alan", lastName: "Turing", account: 0.0, isKfetier: false },
                    { firstName: "Ada", lastName: "Lovelace", account: 15.75, isKfetier: true },
                    { firstName: "Grace", lastName: "Hopper", account: 5.0, isKfetier: false },
                    { firstName: "Nikola", lastName: "Tesla", account: 50.0, isKfetier: true },
                    { firstName: "Isaac", lastName: "Newton", account: 20.0, isKfetier: false },
                    { firstName: "Albert", lastName: "Einstein", account: 30.0, isKfetier: true },
                    { firstName: "Rosalind", lastName: "Franklin", account: 12.5, isKfetier: false },
                    { firstName: "Stephen", lastName: "Hawking", account: 40.0, isKfetier: true },
                    { firstName: "Katherine", lastName: "Johnson", account: 8.0, isKfetier: false },
                    { firstName: "Tim", lastName: "Berners-Lee", account: 18.0, isKfetier: true },
                    { firstName: "Margaret", lastName: "Hamilton", account: 22.0, isKfetier: false },
                    { firstName: "Elon", lastName: "Musk", account: 100.0, isKfetier: true },
                    { firstName: "Sophie", lastName: "Germain", account: 7.5, isKfetier: false }
                ];

                for (const cust of sampleCustomers) {
                    const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
                    console.log(`Inserting: ${cust.firstName} ${cust.lastName} with cat ID: ${randomCat.id}`);
                    await db.insert(customers).values({
                        firstName: cust.firstName,
                        lastName: cust.lastName,
                        account: cust.account,
                        isKfetier: cust.isKfetier, 
                        categoryId: randomCat.id
                    });
                }
                console.log("Customers seeded OK.");
            }
        }
    } catch (e) {
        console.error("❌ Seed Customers error:", e);
    }
}
