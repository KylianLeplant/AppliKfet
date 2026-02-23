<script lang="ts">
    import CustomersPage from '$lib/components/customers/CustomersPage.svelte';
    import { onMount } from "svelte";
    import { initDb, resetDb, type ProductCategory, type Customer, type Product } from "$lib/db";
    import CatalogPage from "$lib/components/shop/CatalogPage.svelte";
    import ProductsPage from "$lib/components/shop/ProductsPage.svelte";
    import ProductQuantityPage from "$lib/components/shop/ProductQuantityPage.svelte";
    
    const SAVED_VIEW_KEY = "app_current_view";
    
    let currentView = $state<"home" | "customers" | "catalog" | "products" | "quantity">(
        (sessionStorage.getItem(SAVED_VIEW_KEY) as any) || "home"
    );
    let selectedCategory = $state<ProductCategory | null>(null);
    let selectedCustomerOrder = $state<Customer | null>(null);
    let selectedProduct = $state<Product | null>(null);

    $effect(() => {
        sessionStorage.setItem(SAVED_VIEW_KEY, currentView);
    });

    function handleStartOrder(customer: Customer) {
        selectedCustomerOrder = customer;
        currentView = "catalog";
    }

    function navigateToProducts(category: ProductCategory) {
        selectedCategory = category;
        currentView = "products";
    }

    function selectProduct(product: Product) {
        selectedProduct = product;
        currentView = "quantity";
    }

    function handleQuantityConfirm(quantity: number, total: number) {
        console.log(`Confirmed: ${quantity}x ${selectedProduct?.name} for ${total}€`);
        alert(`Commande confirmée : ${quantity}x ${selectedProduct?.name} pour ${total.toFixed(2)}€`);
        // On revient au catalogue pour la suite de la commande, ou n'importe quel autre view.
        currentView = "catalog"; 
    }

    onMount(async () => {
        try {
            await initDb();
        } catch (error) {
            console.error("❌ Erreur critique dans App.svelte :", error);
        }
    });

    async function handleReset() {
        if (confirm("Reset database?")) {
            sessionStorage.removeItem(SAVED_VIEW_KEY);
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
                <CustomersPage onStartOrder={handleStartOrder} />
            </div>
        {:else if currentView === "catalog"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CatalogPage 
                    onCategorySelect={navigateToProducts} 
                    customer={selectedCustomerOrder} 
                />
            </div>
        {:else if currentView === "products"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="flex justify-between items-center mb-6">
                    <button 
                        onclick={() => currentView = "catalog"}
                        class="text-white/80 hover:text-white flex items-center gap-2 font-bold"
                    >
                        ← Retour au catalogue
                    </button>
                    {#if selectedCustomerOrder}
                        <div class="bg-white/20 px-4 py-2 rounded-lg text-white font-semibold">
                            Commande pour : {selectedCustomerOrder.firstName} {selectedCustomerOrder.lastName}
                        </div>
                    {/if}
                </div>
                {#if selectedCategory}
                  <ProductsPage 
                    productCategory={selectedCategory} 
                    customer={selectedCustomerOrder} 
                    onProductSelect={selectProduct}
                  />
                {/if}
            </div>
        {:else if currentView === "quantity"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 flex justify-center">
                {#if selectedProduct}
                    <ProductQuantityPage 
                        product={selectedProduct} 
                        customer={selectedCustomerOrder}
                        onConfirm={handleQuantityConfirm}
                        onBack={() => currentView = "products"}
                    />
                {/if}
            </div>
        {/if}
    </div>
</main>
