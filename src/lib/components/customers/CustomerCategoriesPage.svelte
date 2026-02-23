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

<div class="space-y-6 w-full animate-in fade-in duration-500">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 class="text-4xl font-black text-white uppercase tracking-tighter">Promotions Clients</h1>
            <p class="text-white/70 font-bold uppercase tracking-widest text-xs">Gestion des Départs et Années</p>
        </div>
        <button 
            onclick={startAdd}
            class="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-white/20 transition-all active:scale-95 uppercase tracking-widest text-sm"
        >
            Ajouter une promotion
        </button>
    </div>

    <!-- Filtres et Recherche -->
    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
        <Input 
            type="text" 
            placeholder="Rechercher par nom, département ou année..." 
            bind:value={searchQuery}
            class="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-indigo-500 h-12 text-lg font-bold"
        />
    </div>

    <!-- Liste des Catégories Clients -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each filteredCategories as category}
            <div class="bg-white/95 rounded-2xl p-6 shadow-xl border border-white/20 flex flex-col justify-between group hover:border-indigo-300 transition-all">
                <div>
                   <div class="flex justify-between items-start mb-2">
                        <span class="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                            {category.dept}
                        </span>
                        <div class="flex gap-1">
                            <button onclick={() => startEdit(category)} class="text-gray-400 hover:text-indigo-600 p-1">✏️</button>
                            <button onclick={() => handleDelete(category.id)} class="text-gray-400 hover:text-red-500 p-1">🗑️</button>
                        </div>
                   </div>
                   <h3 class="font-black text-gray-800 uppercase text-2xl tracking-tighter mb-1 leading-none">{category.name}</h3>
                   <p class="text-gray-500 font-bold text-sm uppercase">{category.year}</p>
                </div>
            </div>
        {/each}
    </div>

    <!-- Modal d'édition/ajout -->
    {#if isEditing}
        <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div class="p-8 space-y-6">
                    <h2 class="text-2xl font-black text-gray-800 uppercase tracking-tighter border-b pb-4">
                        {currentCategory.id ? 'Modifier' : 'Ajouter'} une promotion
                    </h2>

                    <div class="grid grid-cols-1 gap-4">
                        <div class="space-y-1">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nom (ex: FISE 2026)</span>
                            <Input bind:value={currentCategory.name} class="font-bold h-12" placeholder="Nom de la classe" />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Département</span>
                                <Input bind:value={currentCategory.dept} class="font-bold h-12" placeholder="GIM, GEA, etc." />
                            </div>
                            <div class="space-y-1">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Année</span>
                                <Input bind:value={currentCategory.year} class="font-bold h-12" placeholder="1A, 2A, 3A..." />
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
                            onclick={saveCategory}
                            class="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
                        >
                            {currentCategory.id ? 'Valider' : 'Créer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
