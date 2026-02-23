import { categories, customers, productsCategories, products } from "./schema";
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
            await db.insert(categories).values({
                        name: `$PeiP1`,
                        dept: "PeiP",
                        year: "PeiP1"
                    });
                    
            await db.insert(categories).values({
                        name: `$PeiP2`,
                        dept: "PeiP",
                        year: "PeiP2"
                    });
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
                    { firstName: "Sophie", lastName: "Germain", account: 7.5, isKfetier: false },
                    { firstName: "Leonardo", lastName: "da Vinci", account: 35.0, isKfetier: true },
                    { firstName: "Galileo", lastName: "Galilei", account: 28.0, isKfetier: false },
                    { firstName: "Marie", lastName: "Curie", account: 25.0, isKfetier: true },
                    { firstName: "Johannes", lastName: "Kepler", account: 14.0, isKfetier: false },
                    { firstName: "Carl", lastName: "Sagan", account: 9.0, isKfetier: true },
                    { firstName: "Jane", lastName: "Goodall", account: 6.0, isKfetier: false },
                    { firstName: "Richard", lastName: "Feynman", account: 27.0, isKfetier: true },
                    { firstName: "Dmitri", lastName: "Mendeleev", account: 11.0, isKfetier: false }
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