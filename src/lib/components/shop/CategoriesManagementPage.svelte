<script lang="ts">
    import { onMount } from "svelte";
    import { 
        getProductsCategories, 
        updateProductCategory, 
        createProductCategory, 
        deleteProductCategory,
        type ProductCategory,
        type NewProductCategory
    } from "$lib/db";
    import * as FileDropZone from "$lib/components/ui/file-drop-zone/index.js";
    import { invoke } from "@tauri-apps/api/core";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { toast } from "svelte-sonner";

    let categories = $state<ProductCategory[]>([]);
    let searchQuery = $state("");
    let isEditing = $state(false);
    let currentCategory = $state<Partial<ProductCategory>>({
        name: "",
        imagePath: ""
    });

    onMount(async () => {
        await refreshData();
    });

    async function refreshData() {
        categories = (await getProductsCategories()) as ProductCategory[];
    }

    let filteredCategories = $derived(
        categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    function startEdit(category: ProductCategory) {
        currentCategory = { ...category };
        isEditing = true;
    }

    function startAdd() {
        currentCategory = {
            name: "",
            imagePath: ""
        };
        isEditing = true;
    }

    async function saveCategory() {
        if (!currentCategory.name) {
            toast.error("Veuillez remplir le nom de la catégorie");
            return;
        }

        try {
            if (currentCategory.id) {
                await updateProductCategory(currentCategory.id, currentCategory as NewProductCategory);
                toast.success("Catégorie mise à jour");
            } else {
                await createProductCategory(currentCategory as NewProductCategory);
                toast.success("Catégorie créée");
            }
            isEditing = false;
            await refreshData();
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de l'enregistrement");
        }
    }

    async function handleDelete(id: number) {
        if (confirm("Supprimer cette catégorie ? Cela ne supprimera pas les produits associés mais ils n'auront plus de catégorie.")) {
            await deleteProductCategory(id);
            toast.success("Catégorie supprimée");
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
                folder: "products_categories",
                filename: file.name,
                content: Array.from(bytes) // Tauri v2 handles Vec<u8> from number[]
            });
            
            currentCategory.imagePath = path;
            toast.success("Image téléchargée : " + file.name);
        } catch (e) {
            console.error(e);
            toast.error("Erreur : " + e);
        }
    }
</script>

<div class="space-y-6 w-full animate-in fade-in duration-500">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 class="text-4xl font-black text-white uppercase tracking-tighter">Gestion des Catégories</h1>
            <p class="text-white/70 font-bold uppercase tracking-widest text-xs">Organisation du Catalogue</p>
        </div>
        <Button 
            variant="ghost"
            onclick={startAdd}
            class="bg-white text-indigo-600 px-6 py-3 h-auto rounded-xl font-black shadow-lg hover:shadow-white/20 hover:bg-white hover:text-indigo-600 transition-all active:scale-95 uppercase tracking-widest text-sm"
        >
            Ajouter une catégorie
        </Button>
    </div>

    <!-- Filtres et Recherche -->
    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
        <Input 
            type="text" 
            placeholder="Rechercher une catégorie..." 
            bind:value={searchQuery}
            class="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-indigo-500 h-12 text-lg font-bold"
        />
    </div>

    <!-- Liste des Catégories -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each filteredCategories as category}
            <div class="bg-white/95 rounded-2xl overflow-hidden shadow-xl border border-white/20 flex flex-col group h-48">
                <div class="flex-1 bg-gray-100 relative overflow-hidden">
                    {#if category.imagePath}
                        <img src={category.imagePath} alt={category.name} class="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    {:else}
                        <div class="w-full h-full flex items-center justify-center text-gray-300 font-black uppercase text-xs">No Meta</div>
                    {/if}
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                        <h3 class="font-black text-white uppercase text-xl leading-tight tracking-tighter">{category.name}</h3>
                    </div>
                    <div class="absolute top-2 right-2 flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onclick={() => startEdit(category)} 
                            class="bg-white/90 p-2 rounded-lg text-indigo-600 shadow-sm hover:bg-white hover:text-indigo-600 transition-all active:scale-95"
                        >
                            ✏️
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onclick={() => handleDelete(category.id)} 
                            class="bg-red-500/90 p-2 rounded-lg text-white shadow-sm hover:bg-red-600 hover:text-white transition-all active:scale-95"
                        >
                            🗑️
                        </Button>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Modal d'édition/ajout -->
    <Dialog.Root bind:open={isEditing}>
        <Dialog.Content class="sm:max-w-lg p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
            <div class="p-8 space-y-6">
                <Dialog.Header>
                    <Dialog.Title class="text-2xl font-black text-gray-800 uppercase tracking-tighter border-b pb-4">
                        {currentCategory.id ? 'Modifier' : 'Ajouter'} une catégorie
                    </Dialog.Title>
                </Dialog.Header>

                <div class="space-y-4">
                    <div class="space-y-1">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nom de la catégorie</span>
                        <Input bind:value={currentCategory.name} class="font-bold h-12" placeholder="Boissons, Snacks, etc." />
                    </div>

                    <div class="space-y-1">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Image de couverture</span>
                        
                        <FileDropZone.Root onUpload={handleUpload} accept="image/*" maxFiles={1}>
                            <FileDropZone.Trigger>
                                <div 
                                    class="border-2 border-dashed border-gray-200 rounded-xl p-6 transition-colors hover:bg-gray-50 text-center cursor-pointer w-full"
                                >
                                    {#if currentCategory.imagePath}
                                        <div class="flex flex-col items-center gap-2 mb-2">
                                            <img src={currentCategory.imagePath} alt="Aperçu" class="w-24 h-24 object-cover rounded-xl shadow-lg" />
                                            <span class="text-[10px] font-mono text-gray-500 break-all max-w-[200px]">{currentCategory.imagePath}</span>
                                        </div>
                                    {:else}
                                        <div class="py-4">
                                            <p class="text-xs text-gray-400 uppercase font-black">Glissez une image ici</p>
                                            <p class="text-[8px] text-gray-300">ou cliquez pour sélectionner</p>
                                        </div>
                                    {/if}
                                </div>
                            </FileDropZone.Trigger>
                        </FileDropZone.Root>
                        
                        <Input bind:value={currentCategory.imagePath} class="h-8 font-mono text-[10px] mt-2" placeholder="Ex: static/products_categories/boisson.png" />
                    </div>
                </div>

                <div class="flex gap-4 pt-6">
                    <Button 
                        variant="ghost"
                        onclick={() => isEditing = false}
                        class="flex-1 py-4 px-6 h-auto border border-gray-200 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Annuler
                    </Button>
                    <Button 
                        variant="ghost"
                        onclick={saveCategory}
                        class="flex-[2] py-4 px-6 h-auto bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:text-white transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                    >
                        {currentCategory.id ? 'Modifier' : 'Créer'}
                    </Button>
                </div>
            </div>
        </Dialog.Content>
    </Dialog.Root>
</div>
