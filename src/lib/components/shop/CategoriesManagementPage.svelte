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
    import { Label } from "$lib/components/ui/label/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { toast } from "svelte-sonner";
    import { resolveImageSrc } from "$lib/images";

    type SaveImageResponse = {
        path: string;
        alreadyExisted: boolean;
    };

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
            
            const result = await invoke<SaveImageResponse>("save_image", {
                folder: "products_categories",
                filename: file.name,
                content: Array.from(bytes) // Tauri v2 handles Vec<u8> from number[]
            });
            
            currentCategory.imagePath = result.path;
            if (result.alreadyExisted) {
                toast.warning("L'image existe déjà : utilisation du fichier existant");
            } else {
                toast.success("Image téléchargée : " + file.name);
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur : " + e);
        }
    }
</script>

<div class="space-y-4 w-full">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
            <h1 class="text-2xl font-semibold text-slate-800">Gestion des catégories</h1>
            <p class="text-sm text-slate-500">Organisation du catalogue</p>
        </div>
        <Button onclick={startAdd}>
            Ajouter une catégorie
        </Button>
    </div>

    <Input 
        type="text" 
        placeholder="Rechercher une catégorie..." 
        bind:value={searchQuery}
    />

    <!-- Liste des Catégories -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {#each filteredCategories as category}
            <div class="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-44">
                <div class="flex-1 bg-slate-100 relative overflow-hidden">
                    {#if category.imagePath}
                        <img src={resolveImageSrc(category.imagePath) ?? undefined} alt={category.name} class="w-full h-full object-cover" />
                    {:else}
                        <div class="w-full h-full flex items-center justify-center text-slate-300 text-sm">Pas d'image</div>
                    {/if}
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <h3 class="font-semibold text-white text-lg">{category.name}</h3>
                    </div>
                    <div class="absolute top-2 right-2 flex gap-1">
                        <Button 
                            variant="secondary" 
                            size="icon"
                            onclick={() => startEdit(category)}
                            class="h-7 w-7"
                        >
                            <span class="text-xs">✎</span>
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="icon"
                            onclick={() => handleDelete(category.id)}
                            class="h-7 w-7"
                        >
                            <span class="text-xs">×</span>
                        </Button>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Modal d'édition/ajout -->
    <Dialog.Root bind:open={isEditing}>
        <Dialog.Content class="sm:max-w-md">
            <Dialog.Header>
                <Dialog.Title>
                    {currentCategory.id ? 'Modifier' : 'Ajouter'} une catégorie
                </Dialog.Title>
            </Dialog.Header>

            <div class="space-y-4 py-2">
                <div class="space-y-1">
                    <Label>Nom</Label>
                    <Input bind:value={currentCategory.name} placeholder="Boissons, Snacks, etc." />
                </div>

                <div class="space-y-1">
                    <Label>Image</Label>
                    <FileDropZone.Root onUpload={handleUpload} accept="image/*" maxFiles={1}>
                        <FileDropZone.Trigger>
                            <div class="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 w-full">
                                {#if currentCategory.imagePath}
                                    <div class="flex flex-col items-center gap-2">
                                        <img src={resolveImageSrc(currentCategory.imagePath) ?? undefined} alt="Aperçu" class="w-20 h-20 object-cover rounded" />
                                        <span class="text-xs text-slate-500 break-all max-w-[200px]">{currentCategory.imagePath}</span>
                                    </div>
                                {:else}
                                    <p class="text-sm text-slate-400">Glissez une image ici</p>
                                {/if}
                            </div>
                        </FileDropZone.Trigger>
                    </FileDropZone.Root>
                    <Input bind:value={currentCategory.imagePath} class="text-xs mt-1" placeholder="Chemin vers l'image" />
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
                    onclick={saveCategory}
                    class="flex-[2]"
                >
                    {currentCategory.id ? 'Enregistrer' : 'Créer'}
                </Button>
            </div>
        </Dialog.Content>
    </Dialog.Root>
</div>
