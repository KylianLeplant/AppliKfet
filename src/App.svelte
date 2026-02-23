<script lang="ts">
    import CustomersPage from '$lib/components/customers/CustomersPage.svelte';
    import { onMount } from "svelte";
    import { initDb, resetDb } from "$lib/db";
    
    let currentView = $state<"home" | "customers">("home");

    onMount(async () => {
        try {
            await initDb();
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
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 select-none"
>
    <!-- Barre de Navigation Supérieure -->
    <nav class="absolute top-0 left-0 right-0 p-4 bg-white/10 flex justify-between items-center backdrop-blur-md z-40">
        <div class="flex gap-4">
            <button 
                onclick={() => currentView = "home"}
                class="px-4 py-2 rounded-lg font-bold transition-all {currentView === 'home' ? 'bg-white text-indigo-600 shadow-md' : 'text-white hover:bg-white/20'}"
            >
                Accueil
            </button>
            <button 
                onclick={() => currentView = "customers"}
                class="px-4 py-2 rounded-lg font-bold transition-all {currentView === 'customers' ? 'bg-white text-indigo-600 shadow-md' : 'text-white hover:bg-white/20'}"
            >
                Liste Clients
            </button>
        </div>
        
        <button onclick={handleReset} class="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
            Reset DB
        </button>
    </nav>

    <!-- Contenu de la Page -->
    <div class="w-full max-w-7xl mt-12">
        {#if currentView === "home"}
            <div class="bg-white/90 p-12 rounded-3xl shadow-2xl text-center max-w-2xl mx-auto border border-white/40">
                <h1 class="text-5xl font-extrabold mb-6 text-gray-800 tracking-tight">AppliKfet</h1>
                <p class="text-xl text-gray-600 mb-8 leading-relaxed">Bienvenue sur votre outil de gestion de KFet. Gérez vos clients, leurs comptes et vos catégories simplement.</p>
                <button 
                    onclick={() => currentView = "customers"}
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all scale-100 hover:scale-105"
                >
                    Accéder à la Gestion Clients
                </button>
            </div>
        {:else if currentView === "customers"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CustomersPage />
            </div>
        {/if}
    </div>
</main>
