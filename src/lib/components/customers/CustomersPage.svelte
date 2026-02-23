<script lang="ts">
  import CustomersTable from './CustomersTable.svelte';
  import { type Customer, type Category, getCategories, updateCustomer } from "$lib/db";
  import { onMount } from 'svelte';
  import Button from '../ui/button/button.svelte';
  import { Input } from '../ui/input';

  let { onStartOrder }: { onStartOrder: (customer: Customer) => void } = $props();
  let selectedCustomer = $state<Customer | null>(null);
  let isEditing = $state(false);
  let allCategories = $state<Category[]>([]);
  let refreshCount = $state(0);
  
  // Form state
  let editFirstName = $state("");
  let editLastName = $state("");
  let editIsKfetier = $state(false);
  let editDept = $state("");
  let editYear = $state("");

  onMount(async () => {
    allCategories = await getCategories();
  });

  function startEditing() {
    if (!selectedCustomer) return;
    editFirstName = selectedCustomer.firstName;
    editLastName = selectedCustomer.lastName;
    editIsKfetier = selectedCustomer.isKfetier || false;
    editDept = selectedCustomer.dept || "";
    editYear = selectedCustomer.year || "";
    isEditing = true;
  }

  // Liste exhaustive des départements (toujours disponible)
  let allUniqueDepts = $derived(Array.from(new Set(allCategories.map(c => c.dept))).sort());

  // Liste des années filtrée par le département choisi
  let availableYears = $derived.by(() => {
    if (!editDept) return Array.from(new Set(allCategories.map(c => c.year))).sort();
    const yearsForDept = allCategories
      .filter(c => c.dept === editDept)
      .map(c => c.year);
    return Array.from(new Set(yearsForDept)).sort();
  });

  // Si le département change et que l'année devient incompatible, on met une valeur par défaut
  $effect(() => {
    if (editDept && !availableYears.includes(editYear)) {
      editYear = availableYears[0] || "";
    }
  });

  async function handleSave() {
    if (!selectedCustomer) return;
    
    // Find category ID for the selected dept and year
    const category = allCategories.find(c => c.dept === editDept && c.year === editYear);
    if (!category) {
        alert("Combinaison Département/Année invalide.");
        return;
    }

    try {
        await updateCustomer(selectedCustomer.id, {
            firstName: editFirstName,
            lastName: editLastName,
            isKfetier: editIsKfetier,
            categoryId: category.id
        });
        
        // Update local object properties if they are reactive (it should be)
        if (selectedCustomer) {
            selectedCustomer.firstName = editFirstName;
            selectedCustomer.lastName = editLastName;
            selectedCustomer.isKfetier = editIsKfetier;
            selectedCustomer.dept = category.dept;
            selectedCustomer.year = category.year;
            selectedCustomer.categoryName = category.name;
        }

        isEditing = false;
        refreshCount++;
        // location.reload(); no longer needed
    } catch (e) {
        console.error("Error updating customer:", e);
    }
  }
</script>

<div class="flex flex-col gap-6 w-full max-w-6xl">
    <div class="flex justify-between items-end">
        <div class="flex flex-col gap-4">
            <div>
                <h1 class="text-3xl font-bold text-white">Gestion des Clients</h1>
                <p class="text-gray-200">Sélectionnez un client dans la liste pour commencer une commande</p>
            </div>
            
            <div class="flex gap-4">
                <button 
                    onclick={() => selectedCustomer && onStartOrder(selectedCustomer)}
                    disabled={!selectedCustomer}
                    class="bg-white text-indigo-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all 
                    {selectedCustomer 
                        ? 'hover:bg-indigo-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100' 
                        : 'opacity-50 cursor-not-allowed transform-none'}"
                >
                    🛒 Passer une commande {selectedCustomer ? `pour ${selectedCustomer.firstName}` : ''}
                </button>

                {#if selectedCustomer}
                    <button 
                        onclick={startEditing}
                        class="bg-indigo-600/50 hover:bg-indigo-600/80 text-white font-bold py-3 px-6 rounded-xl shadow-lg border border-indigo-200/20 backdrop-blur-sm transition-all animate-in fade-in zoom-in-95"
                    >
                        ✎ Modifier le client
                    </button>
                {/if}
            </div>
        </div>
        
        {#if isEditing}
            <div class="bg-white p-6 rounded-2xl shadow-2xl border border-indigo-200 w-full max-w-md animate-in slide-in-from-right-8 duration-300 z-50 fixed right-8 top-24">
                <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span class="text-indigo-600 text-2xl">✎</span> 
                    Édition du client
                </h2>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider" for="fn">Prénom</label>
                            <Input id="fn" bind:value={editFirstName} class="h-10" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider" for="ln">Nom</label>
                            <Input id="ln" bind:value={editLastName} class="h-10" />
                        </div>
                    </div>

                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <input 
                            type="checkbox" 
                            id="isk" 
                            bind:checked={editIsKfetier}
                            class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label for="isk" class="font-bold text-gray-700 cursor-pointer">Compte Kfétier</label>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label for="edit-dept" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Dept.</label>
                            <select 
                                id="edit-dept"
                                bind:value={editDept}
                                class="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="" disabled>Dépt.</option>
                                {#each allUniqueDepts as dept}
                                    <option value={dept}>{dept}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-1.5">
                            <label for="edit-year" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Année</label>
                            <select 
                                id="edit-year"
                                bind:value={editYear}
                                class="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="" disabled>Année</option>
                                {#each availableYears as year}
                                    <option value={year}>{year}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-6 border-t border-gray-100">
                        <button 
                            onclick={() => isEditing = false}
                            class="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            onclick={handleSave}
                            class="flex-1 px-4 py-2 bg-indigo-600 rounded-lg font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
            <!-- Overlay -->
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onclick={() => isEditing = false}></div>
        {/if}
    </div>

    <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <CustomersTable bind:selectedCustomer refreshTrigger={refreshCount} />
    </div>
</div>
