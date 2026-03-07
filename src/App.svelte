<script lang="ts">
    import CustomersPage from '$lib/components/customers/CustomersPage.svelte';
    import { onMount } from "svelte";
    import { initDb, resetDb, createOrder, type ProductCategory, type Customer, type Product } from "$lib/db";
    import CatalogPage from "$lib/components/shop/CatalogPage.svelte";
    import ProductsPage from "$lib/components/shop/ProductsPage.svelte";
    import ProductQuantityPage from "$lib/components/shop/ProductQuantityPage.svelte";
    import ProductsManagementPage from "$lib/components/shop/ProductsManagementPage.svelte";
    import CategoriesManagementPage from "$lib/components/shop/CategoriesManagementPage.svelte";
    import CustomerCategoriesPage from "$lib/components/customers/CustomerCategoriesPage.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import { toast } from "svelte-sonner";
    import { Button } from "$lib/components/ui/button";
    import Particles from "$lib/components/particles/Particles.svelte";
    
    const SAVED_VIEW_KEY = "app_current_view";
    
    let currentView = $state<"customers" | "catalog" | "products" | "quantity" | "management" | "categories_mgmt" | "customers_categories">(
        (sessionStorage.getItem(SAVED_VIEW_KEY) as any) || "customers"
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

    async function handleQuantityConfirm(quantity: number, total: number) {
        if (!selectedProduct) return;
        
        try {
            await createOrder({
                customerId: selectedCustomerOrder?.id ?? null,
                productId: selectedProduct.id,
                quantity: quantity,
                totalPrice: total
            });
            
            toast.success(`Commande validée`, {
                description: `${quantity}x ${selectedProduct.name} pour ${selectedCustomerOrder?.firstName} ${selectedCustomerOrder?.lastName} (${total.toFixed(2)} €)`,
            });
            
            currentView = "catalog"; 
        } catch (error) {
            console.error("❌ Erreur lors de l'enregistrement de la commande :", error);
            alert("Erreur lors de l'enregistrement de la commande.");
        }
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
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2 sm:p-4 md:p-8 select-none relative"
>
    <Particles className="absolute inset-0 pointer-events-none" refresh={true} />
    <!-- Barre de Navigation Supérieure -->
    <nav class="absolute top-0 left-0 right-0 p-2 sm:p-4 bg-white/10 flex flex-wrap justify-between items-center backdrop-blur-md z-40 gap-2">
        <div class="flex flex-wrap gap-2 sm:gap-4">
            <Button 
                variant="ghost"
                onclick={() => currentView = "customers"}
                class="px-2 sm:px-4 py-1.5 sm:py-2 h-auto rounded-lg text-xs sm:text-sm font-bold transition-all {currentView === 'customers' ? 'bg-white text-indigo-600 shadow-md hover:bg-white hover:text-indigo-600' : 'text-white hover:bg-white/20 hover:text-white'}"
            >
                Clients
            </Button>
            <Button 
                variant="ghost"
                onclick={() => currentView = "customers_categories"}
                class="px-2 sm:px-4 py-1.5 sm:py-2 h-auto rounded-lg text-xs sm:text-sm font-bold transition-all {currentView === 'customers_categories' ? 'bg-white text-indigo-600 shadow-md hover:bg-white hover:text-indigo-600' : 'text-white hover:bg-white/20 hover:text-white'}"
            >
                Classes
            </Button>
            <Button 
                variant="ghost"
                onclick={() => currentView = "management"}
                class="px-2 sm:px-4 py-1.5 sm:py-2 h-auto rounded-lg text-xs sm:text-sm font-bold transition-all {currentView === 'management' ? 'bg-white text-indigo-600 shadow-md hover:bg-white hover:text-indigo-600' : 'text-white hover:bg-white/20 hover:text-white'}"
            >
                Produits
            </Button>
            <Button 
                variant="ghost"
                onclick={() => currentView = "categories_mgmt"}
                class="px-2 sm:px-4 py-1.5 sm:py-2 h-auto rounded-lg text-xs sm:text-sm font-bold transition-all {currentView === 'categories_mgmt' ? 'bg-white text-indigo-600 shadow-md hover:bg-white hover:text-indigo-600' : 'text-white hover:bg-white/20 hover:text-white'}"
            >
                Catégories
            </Button>
        </div>
        
        <Button 
            variant="ghost"
            onclick={handleReset} 
            class="bg-red-500/80 hover:bg-red-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors"
        >
            Reset DB
        </Button>
    </nav>

    <Toaster richColors position="top-right" />

    <!-- Contenu de la Page -->
    <div class="w-full max-w-7xl mt-16 sm:mt-20 md:mt-24 relative z-10 px-2 sm:px-4">

        {#if currentView === "customers"}
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
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-4 md:px-0">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                    <Button 
                        variant="ghost"
                        onclick={() => currentView = "catalog"}
                        class="text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 font-bold text-sm sm:text-base py-2 px-3 sm:px-4 h-auto rounded-lg"
                    >
                        ← <span class="hidden sm:inline">Retour au catalogue</span><span class="sm:hidden">Retour</span>
                    </Button>
                    {#if selectedCustomerOrder}
                        <div class="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white font-semibold text-xs sm:text-sm">
                            <span class="hidden sm:inline">Commande pour :</span> {selectedCustomerOrder.firstName} {selectedCustomerOrder.lastName}
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
        {:else if currentView === "management"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ProductsManagementPage />
            </div>
        {:else if currentView === "categories_mgmt"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CategoriesManagementPage />
            </div>
        {:else if currentView === "customers_categories"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CustomerCategoriesPage />
            </div>
        {/if}
    </div>
</main>
