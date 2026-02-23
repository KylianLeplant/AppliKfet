<script lang="ts">
    import { onMount } from "svelte";
    import { 
        getProducts, 
        getProductsCategories, 
        updateProduct, 
        createProduct, 
        deleteProduct,
        type Product, 
        type ProductCategory,
        type NewProduct
    } from "$lib/db";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { toast } from "svelte-sonner";

    let products = $state<Product[]>([]);
    let categories = $state<ProductCategory[]>([]);
    let searchQuery = $state("");
    let isEditing = $state(false);
    let currentProduct = $state<Partial<Product>>({
        name: "",
        price: 0,
        priceForThree: null,
        priceForKfetier: 0,
        priceForThreeKfetier: null,
        categoryId: null,
        imagePath: ""
    });

    onMount(async () => {
        await refreshData();
    });

    async function refreshData() {
        products = (await getProducts()) as Product[];
        categories = (await getProductsCategories()) as ProductCategory[];
    }

    let filteredProducts = $derived(
        products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    function startEdit(product: Product) {
        currentProduct = { ...product };
        isEditing = true;
    }

    function startAdd() {
        currentProduct = {
            name: "",
            price: 0,
            priceForThree: null,
            priceForKfetier: 0,
            priceForThreeKfetier: null,
            categoryId: categories[0]?.id ?? null,
            imagePath: ""
        };
        isEditing = true;
    }

    async function saveProduct() {
        if (!currentProduct.name || currentProduct.price === undefined || currentProduct.priceForKfetier === undefined) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        try {
            if (currentProduct.id) {
                await updateProduct(currentProduct.id, currentProduct as NewProduct);
                toast.success("Produit mis à jour");
            } else {
                await createProduct(currentProduct as NewProduct);
                toast.success("Produit créé");
            }
            isEditing = false;
            await refreshData();
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de l'enregistrement");
        }
    }

    async function handleDelete(id: number) {
        if (confirm("Supprimer ce produit ?")) {
            await deleteProduct(id);
            toast.success("Produit supprimé");
            await refreshData();
        }
    }

    // Simple Drop Zone handlers for image path (UI only simulation for now)
    function handleDrop(e: DragEvent) {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            // Note: In a browser, we can't get the full system path for security reasons.
            // In Tauri, there are ways to get it, but for now we'll simulate setting a relative path if possible
            // Or just warn the user.
            toast.info("Image déposée : " + files[0].name + " (Vérifiez le chemin relatif)");
            // We set the path relative to static/ for testing
            currentProduct.imagePath = `static/products_categories/${files[0].name}`;
        }
    }
</script>

<div class="space-y-6 w-full animate-in fade-in duration-500">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 class="text-4xl font-black text-white uppercase tracking-tighter">Gestion des Produits</h1>
            <p class="text-white/70 font-bold uppercase tracking-widest text-xs">Catalogue et Tarification</p>
        </div>
        <button 
            onclick={startAdd}
            class="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-white/20 transition-all active:scale-95 uppercase tracking-widest text-sm"
        >
            Ajouter un produit
        </button>
    </div>

    <!-- Filtres et Recherche -->
    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
        <Input 
            type="text" 
            placeholder="Rechercher un produit..." 
            bind:value={searchQuery}
            class="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-indigo-500 h-12 text-lg font-bold"
        />
    </div>

    <!-- Liste des Produits -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each filteredProducts as product}
            <div class="bg-white/95 rounded-2xl overflow-hidden shadow-xl border border-white/20 flex flex-col group">
                <div class="h-32 bg-gray-100 relative">
                    {#if product.imagePath}
                        <img src={product.imagePath} alt={product.name} class="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    {:else}
                        <div class="w-full h-full flex items-center justify-center text-gray-300">Pas d'image</div>
                    {/if}
                    <div class="absolute top-2 right-2 flex gap-2">
                        <button onclick={() => startEdit(product)} class="bg-white/90 p-2 rounded-lg text-indigo-600 shadow-sm hover:bg-white transition-colors">
                            <span class="sr-only">Modifier</span>
                            ✏️
                        </button>
                        <button onclick={() => handleDelete(product.id)} class="bg-red-500/90 p-2 rounded-lg text-white shadow-sm hover:bg-red-600 transition-colors">
                            <span class="sr-only">Supprimer</span>
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="font-black text-gray-800 uppercase text-lg leading-tight">{product.name}</h3>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {categories.find(c => c.id === product.categoryId)?.name || 'Sans catégorie'}
                        </p>
                    </div>
                    
                    <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div class="bg-indigo-50 p-2 rounded-lg">
                            <p class="text-gray-500 uppercase font-bold text-[8px]">Standard</p>
                            <p class="font-black text-indigo-600">{product.price.toFixed(2)}€</p>
                            <p class="text-[8px] text-gray-400">Lot 3: {product.priceForThree?.toFixed(2) || '-'}€</p>
                        </div>
                        <div class="bg-purple-50 p-2 rounded-lg">
                            <p class="text-gray-500 uppercase font-bold text-[8px]">Kfetier</p>
                            <p class="font-black text-purple-600">{product.priceForKfetier.toFixed(2)}€</p>
                            <p class="text-[8px] text-gray-400">Lot 3: {product.priceForThreeKfetier?.toFixed(2) || '-'}€</p>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Modal d'édition/ajout (Overlay) -->
    {#if isEditing}
        <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div 
                class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
            >
                <div class="p-8 space-y-6">
                    <h2 class="text-2xl font-black text-gray-800 uppercase tracking-tighter border-b pb-4">
                        {currentProduct.id ? 'Modifier' : 'Ajouter'} un produit
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Infos Générales -->
                        <div class="space-y-4">
                            <div class="space-y-1">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nom du Produit</span>
                                <Input bind:value={currentProduct.name} class="font-bold h-12" placeholder="Cola, Kinder, etc." />
                            </div>

                            <div class="space-y-1">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Catégorie</span>
                                <select 
                                    bind:value={currentProduct.categoryId}
                                    class="w-full h-12 rounded-lg border border-gray-200 px-3 font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {#each categories as cat}
                                        <option value={cat.id}>{cat.name}</option>
                                    {/each}
                                </select>
                            </div>

                            <div class="space-y-1">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Chemin Image</span>
                                <div 
                                    class="border-2 border-dashed border-gray-200 rounded-xl p-4 transition-colors hover:bg-gray-50 text-center cursor-pointer"
                                    ondragover={(e) => e.preventDefault()}
                                    ondrop={handleDrop}
                                    role="region"
                                    aria-label="Zone de dépôt d'image"
                                >
                                    {#if currentProduct.imagePath}
                                        <div class="flex items-center gap-2 mb-2">
                                            <img src={currentProduct.imagePath} alt="Aperçu" class="w-10 h-10 object-cover rounded shadow" />
                                            <span class="text-xs truncate font-mono text-gray-500">{currentProduct.imagePath}</span>
                                        </div>
                                    {:else}
                                        <p class="text-[10px] text-gray-400 uppercase font-black">Glissez une image ici</p>
                                    {/if}
                                    <Input bind:value={currentProduct.imagePath} class="h-8 font-mono text-[10px]" placeholder="Ex: static/img.png" />
                                </div>
                            </div>
                        </div>

                        <!-- Côté Tarifs -->
                        <div class="bg-gray-50 p-6 rounded-2xl space-y-6">
                            <div class="space-y-4">
                                <h4 class="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Standard
                                </h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-1">
                                        <span class="text-[8px] font-bold text-gray-400 uppercase">Prix Unitaire (€)</span>
                                        <Input type="number" step="0.01" bind:value={currentProduct.price} class="font-bold h-10" />
                                    </div>
                                    <div class="space-y-1">
                                        <span class="text-[8px] font-bold text-gray-400 uppercase">Prix Lot de 3 (€)</span>
                                        <Input type="number" step="0.01" bind:value={currentProduct.priceForThree} class="font-bold h-10" />
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <h4 class="text-purple-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-purple-600"></span> Kfetier
                                </h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-1">
                                        <span class="text-[8px] font-bold text-gray-400 uppercase">Prix Unitaire (€)</span>
                                        <Input type="number" step="0.01" bind:value={currentProduct.priceForKfetier} class="font-bold h-10" />
                                    </div>
                                    <div class="space-y-1">
                                        <span class="text-[8px] font-bold text-gray-400 uppercase">Prix Lot de 3 (€)</span>
                                        <Input type="number" step="0.01" bind:value={currentProduct.priceForThreeKfetier} class="font-bold h-10" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-4 pt-6">
                        <button 
                            onclick={() => isEditing = false}
                            class="flex-1 py-4 px-6 border border-gray-200 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                        >
                            Annuler
                        </button>
                        <button 
                            onclick={saveProduct}
                            class="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
                        >
                            {currentProduct.id ? 'Valider les modifications' : 'Créer le produit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>