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
    import { invoke } from "@tauri-apps/api/core";
    import * as FileDropZone from "$lib/components/ui/file-drop-zone/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
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

    // On utilise une string pour le Select de shadcn
    let selectedCategoryId = $state<string>("");

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
        selectedCategoryId = product.categoryId ? product.categoryId.toString() : "";
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
        selectedCategoryId = currentProduct.categoryId ? currentProduct.categoryId.toString() : "";
        isEditing = true;
    }

    function handleCategoryChange(value: string) {
        selectedCategoryId = value;
        currentProduct.categoryId = value ? parseInt(value) : null;
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

    async function handleUpload(files: File[]) {
        if (files.length === 0) return;
        const file = files[0];
        
        try {
            const buffer = await file.arrayBuffer();
             const bytes = new Uint8Array(buffer);
            
            const path = await invoke<string>("save_image", {
                folder: "products",
                filename: file.name,
                content: Array.from(bytes) // Tauri v2 handles Vec<u8> from number[]
            });
            
            currentProduct.imagePath = path;
            toast.success("Image téléchargée : " + file.name);
        } catch (e) {
            console.error(e);
            toast.error("Erreur : " + e);
        }
    }
</script>

<div class="space-y-4 w-full">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
            <h1 class="text-2xl font-semibold text-slate-800">Gestion des produits</h1>
            <p class="text-sm text-slate-500">Catalogue et tarification</p>
        </div>
        <Button onclick={startAdd}>
            Ajouter un produit
        </Button>
    </div>

    <Input 
        type="text" 
        placeholder="Rechercher un produit..." 
        bind:value={searchQuery}
    />

    <!-- Liste des Produits -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each filteredProducts as product}
            <div class="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                <div class="h-32 bg-slate-100 relative">
                    {#if product.imagePath}
                        <img src={product.imagePath} alt={product.name} class="w-full h-full object-cover" />
                    {:else}
                        <div class="w-full h-full flex items-center justify-center text-slate-300 text-sm">Pas d'image</div>
                    {/if}
                    <div class="absolute top-2 right-2 flex gap-1">
                        <Button 
                            variant="secondary"
                            size="icon"
                            onclick={() => startEdit(product)}
                            class="h-8 w-8"
                        >
                            <span class="text-xs">✎</span>
                        </Button>
                        <Button 
                            variant="destructive"
                            size="icon"
                            onclick={() => handleDelete(product.id)}
                            class="h-8 w-8"
                        >
                            <span class="text-xs">×</span>
                        </Button>
                    </div>
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="font-semibold text-slate-800 text-lg">{product.name}</h3>
                        <p class="text-xs text-slate-400">
                            {categories.find(c => c.id === product.categoryId)?.name || 'Sans catégorie'}
                        </p>
                    </div>
                    
                    <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div class="bg-slate-50 p-2 rounded">
                            <p class="text-xs text-slate-400">Standard</p>
                            <p class="font-medium">{product.price.toFixed(2)}€</p>
                            <p class="text-xs text-slate-400">×3 : {product.priceForThree?.toFixed(2) || '-'}€</p>
                        </div>
                        <div class="bg-slate-50 p-2 rounded">
                            <p class="text-xs text-slate-400">Kfetier</p>
                            <p class="font-medium">{product.priceForKfetier.toFixed(2)}€</p>
                            <p class="text-xs text-slate-400">×3 : {product.priceForThreeKfetier?.toFixed(2) || '-'}€</p>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Modal d'édition/ajout -->
    <Dialog.Root bind:open={isEditing}>
        <Dialog.Content class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Header>
                <Dialog.Title>
                    {currentProduct.id ? 'Modifier' : 'Ajouter'} un produit
                </Dialog.Title>
            </Dialog.Header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div class="space-y-4">
                    <div class="space-y-1">
                        <Label>Nom du produit</Label>
                        <Input bind:value={currentProduct.name} placeholder="Cola, Kinder, etc." />
                    </div>

                    <div class="space-y-1">
                        <Label>Catégorie</Label>
                        <Select.Root type="single" bind:value={selectedCategoryId} onValueChange={handleCategoryChange}>
                            <Select.Trigger class="w-full">
                                {categories.find(c => c.id.toString() === selectedCategoryId)?.name || "Sélectionner"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each categories as cat}
                                    <Select.Item value={cat.id.toString()}>{cat.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <div class="space-y-1">
                        <Label>Image</Label>
                        <FileDropZone.Root onUpload={handleUpload} accept="image/*" maxFiles={1}>
                            <FileDropZone.Trigger>
                                <div class="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 w-full">
                                    {#if currentProduct.imagePath}
                                        <div class="flex items-center gap-2 justify-center">
                                            <img src={currentProduct.imagePath} alt="Aperçu" class="w-10 h-10 object-cover rounded" />
                                            <span class="text-xs text-slate-500 truncate max-w-[150px]">{currentProduct.imagePath}</span>
                                        </div>
                                    {:else}
                                        <p class="text-sm text-slate-400">Glissez une image ici</p>
                                    {/if}
                                </div>
                            </FileDropZone.Trigger>
                        </FileDropZone.Root>
                        <Input bind:value={currentProduct.imagePath} class="text-xs" placeholder="Chemin vers l'image" />
                    </div>
                </div>

                <div class="bg-slate-50 p-4 rounded-lg space-y-4">
                    <div class="space-y-3">
                        <h4 class="text-sm font-medium text-slate-600">Tarif standard</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <Label class="text-xs">Prix unitaire (€)</Label>
                                <Input type="number" step="0.01" bind:value={currentProduct.price} />
                            </div>
                            <div class="space-y-1">
                                <Label class="text-xs">Prix lot de 3 (€)</Label>
                                <Input type="number" step="0.01" bind:value={currentProduct.priceForThree} />
                            </div>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h4 class="text-sm font-medium text-slate-600">Tarif kfetier</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <Label class="text-xs">Prix unitaire (€)</Label>
                                <Input type="number" step="0.01" bind:value={currentProduct.priceForKfetier} />
                            </div>
                            <div class="space-y-1">
                                <Label class="text-xs">Prix lot de 3 (€)</Label>
                                <Input type="number" step="0.01" bind:value={currentProduct.priceForThreeKfetier} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex gap-2 pt-2">
                <Button 
                    variant="outline"
                    onclick={() => isEditing = false}
                    class="flex-1"
                >
                    Annuler
                </Button>
                <Button 
                    onclick={saveProduct}
                    class="flex-[2]"
                >
                    {currentProduct.id ? 'Enregistrer' : 'Créer'}
                </Button>
            </div>
        </Dialog.Content>
    </Dialog.Root>
</div>