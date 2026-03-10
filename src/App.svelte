<script lang="ts">
    import CustomersPage from '$lib/components/customers/CustomersPage.svelte';
    import { onMount } from "svelte";
    import { initDb, createOrder, type ProductCategory, type Customer, type Product } from "$lib/db";
    import CatalogPage from "$lib/components/shop/CatalogPage.svelte";
    import ProductsPage from "$lib/components/shop/ProductsPage.svelte";
    import ProductQuantityPage from "$lib/components/shop/ProductQuantityPage.svelte";
    import ProductsManagementPage from "$lib/components/shop/ProductsManagementPage.svelte";
    import CategoriesManagementPage from "$lib/components/shop/CategoriesManagementPage.svelte";
    import CustomerCategoriesPage from "$lib/components/customers/CustomerCategoriesPage.svelte";
    import OrdersPage from "$lib/components/orders/OrdersPage.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import { toast } from "svelte-sonner";
    import { Button } from "$lib/components/ui/button";
    
    const SAVED_VIEW_KEY = "app_current_view";
    
    let currentView = $state<"customers" | "catalog" | "products" | "quantity" | "management" | "categories_mgmt" | "customers_categories" | "orders">(
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

</script>

<main class="min-h-screen bg-slate-50 select-none">
    <!-- Navigation -->
    <nav class="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap gap-1">
            <Button 
                variant={currentView === "customers" ? "default" : "ghost"}
                size="sm"
                onclick={() => currentView = "customers"}
            >
                Clients
            </Button>
            <Button 
                variant={currentView === "customers_categories" ? "default" : "ghost"}
                size="sm"
                onclick={() => currentView = "customers_categories"}
            >
                Classes
            </Button>
            <Button 
                variant={currentView === "management" ? "default" : "ghost"}
                size="sm"
                onclick={() => currentView = "management"}
            >
                Produits
            </Button>
            <Button 
                variant={currentView === "categories_mgmt" ? "default" : "ghost"}
                size="sm"
                onclick={() => currentView = "categories_mgmt"}
            >
                Catégories
            </Button>
            <Button 
                variant={currentView === "orders" ? "default" : "ghost"}
                size="sm"
                onclick={() => currentView = "orders"}
            >
                Commandes
            </Button>
        </div>
    </nav>

    <Toaster richColors position="top-right" />

    <!-- Contenu -->
    <div class="max-w-7xl mx-auto px-4 py-6">
        {#if currentView === "customers"}
            <CustomersPage onStartOrder={handleStartOrder} />
        {:else if currentView === "catalog"}
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CatalogPage 
                    onCategorySelect={navigateToProducts} 
                    customer={selectedCustomerOrder} 
                />
            </div>
        {:else if currentView === "products"}
            <div class="space-y-4">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <Button 
                        variant="ghost"
                        size="sm"
                        onclick={() => currentView = "catalog"}
                    >
                        ← Retour au catalogue
                    </Button>
                    {#if selectedCustomerOrder}
                        <span class="text-sm text-slate-600">
                            Commande pour <strong>{selectedCustomerOrder.firstName} {selectedCustomerOrder.lastName}</strong>
                        </span>
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
            <div class="flex justify-center">
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
            <ProductsManagementPage />
        {:else if currentView === "categories_mgmt"}
            <CategoriesManagementPage />
        {:else if currentView === "customers_categories"}
            <CustomerCategoriesPage />
        {:else if currentView === "orders"}
            <OrdersPage />
        {/if}
    </div>
</main>
