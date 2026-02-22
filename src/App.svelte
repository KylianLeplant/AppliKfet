<script lang="ts">
    import CustomersTable from '$lib/components/customers/CustomersTable.svelte';
    import { onMount } from "svelte";
    import { initDb, getCustomers, resetDb } from "$lib/db";
    
    onMount(async () => {
        console.log("🚀 App.svelte: onMount démarré");
        try {
            console.log("⏳ Initialisation de la DB...");
            await initDb();
            console.log("✅ Base de données initialisée");
            
            const customersData = await getCustomers();
            console.log("📊 Nombre de clients :", customersData.length);
        } catch (error) {
            console.error("❌ Erreur critique dans App.svelte :", error);
        }
      });

    async function handleReset() {
        if (confirm("Reset database?")) {
            await resetDb();
            location.reload();
        }
    }
</script>

<main
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 select-none"
>
    <div class="absolute top-4 right-4 z-50">
        <button onclick={handleReset} class="bg-red-500 text-white px-3 py-1 rounded">Reset DB</button>
    </div>
    
    <div class="bg-white/90 p-6 rounded-xl shadow-2xl w-full max-w-5xl">
        <h1 class="text-2xl font-bold mb-4 text-gray-800">Gestion des Clients</h1>
        <CustomersTable />
    </div>
</main>
