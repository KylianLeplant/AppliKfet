<script lang="ts">
    import { onMount } from "svelte";
    import { 
        getCategories, 
        updateCategory, 
        createCategory, 
        deleteCategory,
        type Category,
        type NewCategory
    } from "$lib/db";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { toast } from "svelte-sonner";

    let categories = $state<Category[]>([]);
    let searchQuery = $state("");
    let isEditing = $state(false);
    let currentCategory = $state<Partial<Category>>({
        name: "",
        dept: "",
        year: ""
    });

    onMount(async () => {
        await refreshData();
    });

    async function refreshData() {
        categories = (await getCategories()) as Category[];
    }

    let filteredCategories = $derived(
        categories.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.year.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    function startEdit(category: Category) {
        currentCategory = { ...category };
        isEditing = true;
    }

    function startAdd() {
        currentCategory = {
            name: "",
            dept: "",
            year: ""
        };
        isEditing = true;
    }

    async function saveCategory() {
        if (!currentCategory.name || !currentCategory.dept || !currentCategory.year) {
            toast.error("Veuillez remplir tous les champs (Nom, Dept, Année)");
            return;
        }

        try {
            if (currentCategory.id) {
                await updateCategory(currentCategory.id, currentCategory as NewCategory);
                toast.success("Catégorie client mise à jour");
            } else {
                await createCategory(currentCategory as NewCategory);
                toast.success("Catégorie client créée");
            }
            isEditing = false;
            await refreshData();
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de l'enregistrement");
        }
    }

    async function handleDelete(id: number) {
        if (confirm("Supprimer cette catégorie ? Cela peut affecter les clients associés.")) {
            try {
                await deleteCategory(id);
                toast.success("Catégorie supprimée");
                await refreshData();
            } catch (e) {
                toast.error("Impossible de supprimer cette catégorie (éventuellement liée à des clients)");
            }
        }
    }
</script>

<div class="space-y-4 w-full">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
            <h1 class="text-2xl font-semibold text-slate-800">Promotions clients</h1>
            <p class="text-sm text-slate-500">Gestion des départements et années</p>
        </div>
        <Button onclick={startAdd}>
            Ajouter une classe
        </Button>
    </div>

    <Input 
        type="text" 
        placeholder="Rechercher par nom, département ou année..." 
        bind:value={searchQuery}
    />

    <!-- Liste des Catégories Clients -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {#each filteredCategories as category}
            <div class="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded">
                            {category.dept}
                        </span>
                        <div class="flex gap-1">
                            <Button variant="secondary" size="icon" onclick={() => startEdit(category)} class="h-7 w-7">
                                <span class="text-xs">✎</span>
                            </Button>
                            <Button variant="destructive" size="icon" onclick={() => handleDelete(category.id)} class="h-7 w-7">
                                <span class="text-xs">×</span>
                            </Button>
                        </div>
                    </div>
                    <h3 class="font-semibold text-slate-800 text-lg mb-1">{category.name}</h3>
                    <p class="text-slate-500 text-sm">{category.year}</p>
                </div>
            </div>
        {/each}
    </div>

    <!-- Modal d'édition/ajout -->
    <Dialog.Root bind:open={isEditing}>
        <Dialog.Content class="sm:max-w-md">
            <Dialog.Header>
                <Dialog.Title>
                    {currentCategory.id ? 'Modifier' : 'Ajouter'} une promotion
                </Dialog.Title>
            </Dialog.Header>

            <div class="space-y-4 py-2">
                <div class="space-y-1">
                    <Label>Nom (ex: FISE 2026)</Label>
                    <Input bind:value={currentCategory.name} placeholder="Nom de la classe" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <Label>Département</Label>
                        <Input bind:value={currentCategory.dept} placeholder="GIM, GEA, etc." />
                    </div>
                    <div class="space-y-1">
                        <Label>Année</Label>
                        <Input bind:value={currentCategory.year} placeholder="1A, 2A, 3A..." />
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
                    onclick={saveCategory}
                    class="flex-[2]"
                >
                    {currentCategory.id ? 'Modifier' : 'Créer'}
                </Button>
            </div>
        </Dialog.Content>
    </Dialog.Root>
</div>
