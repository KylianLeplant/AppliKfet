<script lang="ts">
  import CustomersTable from './CustomersTable.svelte';
  import { type Customer, type Category, getCategories, updateCustomer, addMoneyToCustomer } from "$lib/db";
  import { onMount } from 'svelte';
  import Button from '../ui/button/button.svelte';
  import { Input } from '../ui/input';
  import { Checkbox } from '../ui/checkbox';
  import { Label } from '../ui/label';
  import * as Select from '../ui/select';
  import * as Dialog from "../ui/dialog/index.js";
  import * as Sheet from "../ui/sheet/index.js";
  import * as Card from "../ui/card/index.js";
  import { toast } from "svelte-sonner";

  let { onStartOrder }: { onStartOrder: (customer: Customer) => void } = $props();
  let selectedCustomer = $state<Customer | null>(null);
  let isEditing = $state(false);
  let isAddingMoney = $state(false);
  let amountToAdd = $state(0);
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

  async function handleAddMoney() {
    if (!selectedCustomer || amountToAdd <= 0) return;
    try {
        await addMoneyToCustomer(selectedCustomer.id, amountToAdd);
        if (selectedCustomer.account !== null) {
            selectedCustomer.account += amountToAdd;
        }
        toast.success(`Solde mis à jour`, {
            description: `${amountToAdd}€ ajoutés au compte de ${selectedCustomer.firstName}`
        });
        isAddingMoney = false;
        amountToAdd = 0;
        refreshCount++;
    } catch (e) {
        console.error("Error adding money:", e);
        toast.error("Erreur lors de l'ajout d'argent");
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
                <Button 
                    variant="ghost"
                    onclick={() => selectedCustomer && onStartOrder(selectedCustomer)}
                    disabled={!selectedCustomer}
                    class="bg-white text-indigo-700 font-bold py-3 px-8 h-auto rounded-xl shadow-lg transition-all 
                    {selectedCustomer 
                        ? 'hover:bg-indigo-50 hover:scale-105 active:scale-95 cursor-pointer opacity-100 hover:text-indigo-700' 
                        : 'opacity-50 cursor-not-allowed transform-none'}"
                >
                    🛒 Passer une commande {selectedCustomer ? `pour ${selectedCustomer.firstName}` : ''}
                </Button>

                {#if selectedCustomer}
                    <Button 
                        variant="ghost"
                        onclick={startEditing}
                        class="bg-indigo-600/50 hover:bg-indigo-600/80 text-white font-bold py-3 px-6 h-auto rounded-xl shadow-lg border border-indigo-200/20 backdrop-blur-sm transition-all animate-in fade-in zoom-in-95 hover:text-white"
                    >
                        ✎ Modifier le client
                    </Button>
                    <Button 
                        variant="ghost"
                        onclick={() => isAddingMoney = true}
                        class="bg-emerald-600/50 hover:bg-emerald-600/80 text-white font-bold py-3 px-6 h-auto rounded-xl shadow-lg border border-emerald-200/20 backdrop-blur-sm transition-all animate-in fade-in zoom-in-95 hover:text-white"
                    >
                        💰 Ajouter de l'argent
                    </Button>
                {/if}
            </div>
        </div>
        
        <Dialog.Root bind:open={isAddingMoney}>
            <Dialog.Content class="sm:max-w-[425px] p-0 overflow-hidden border-indigo-100 rounded-2xl">
                <Card.Root class="w-full border-0 shadow-none">
                    <Card.Header class="text-black">
                        <Card.Title class="text-2xl font-black uppercase tracking-tighter">Ajouter du Solde</Card.Title>
                        <Card.Description class="text-indigo-100 font-bold">
                            Client : {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-6">
                        <div class="space-y-4">
                            <div class="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <span class="text-xs font-black text-gray-400 uppercase tracking-widest">Solde actuel</span>
                                <span class="text-2xl font-black text-gray-800">{selectedCustomer?.account?.toFixed(2)} €</span>
                            </div>
                            
                            <div class="space-y-2">
                                <Label for="amount" class="text-xs font-black text-gray-400 uppercase tracking-widest block">Montant à ajouter (€)</Label>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    bind:value={amountToAdd} 
                                    placeholder="Ex: 5.00" 
                                    class="text-xl font-bold h-14 bg-indigo-50/30 border-indigo-100 focus:ring-emerald-500" 
                                    min="0.01" 
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div class="flex gap-3">
                            <Button 
                                variant="ghost"
                                onclick={() => isAddingMoney = false}
                                class="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 h-auto transition-all uppercase tracking-widest text-[10px]"
                            >
                                Annuler
                            </Button>
                            <Button 
                                variant="ghost"
                                onclick={handleAddMoney}
                                class="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold h-auto shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:text-white transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                            >
                                Confirmer (+{amountToAdd}€)
                            </Button>
                        </div>
                    </Card.Content>
                </Card.Root>
            </Dialog.Content>
        </Dialog.Root>

        <Sheet.Root bind:open={isEditing}>
            <Sheet.Content side="right" class="w-[400px] sm:w-[540px] p-6 overflow-y-auto">
                <Sheet.Header class="mb-6">
                    <Sheet.Title class="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span class="text-indigo-600 text-2xl">✎</span> 
                        Édition du client
                    </Sheet.Title>
                </Sheet.Header>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <Label class="text-xs font-bold text-gray-400 uppercase tracking-wider" for="fn">Prénom</Label>
                            <Input id="fn" bind:value={editFirstName} class="h-10" />
                        </div>
                        <div class="space-y-1.5">
                            <Label class="text-xs font-bold text-gray-400 uppercase tracking-wider" for="ln">Nom</Label>
                            <Input id="ln" bind:value={editLastName} class="h-10" />
                        </div>
                    </div>

                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Checkbox 
                            id="isk" 
                            bind:checked={editIsKfetier}
                            class="h-5 w-5 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label for="isk" class="font-bold text-gray-700 cursor-pointer">Compte Kfétier</Label>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <Label for="edit-dept" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Dept.</Label>
                            <Select.Root type="single" bind:value={editDept}>
                                <Select.Trigger id="edit-dept" class="w-full h-10">
                                    {editDept || "Dépt."}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each allUniqueDepts as dept}
                                        <Select.Item value={dept}>{dept}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                        <div class="space-y-1.5">
                            <Label for="edit-year" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Année</Label>
                            <Select.Root type="single" bind:value={editYear}>
                                <Select.Trigger id="edit-year" class="w-full h-10">
                                    {editYear || "Année"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each availableYears as year}
                                        <Select.Item value={year}>{year}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                        <Button 
                            variant="ghost"
                            onclick={() => isEditing = false}
                            class="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 h-auto transition-colors"
                        >
                            Annuler
                        </Button>
                        <Button 
                            variant="ghost"
                            onclick={handleSave}
                            class="flex-1 px-4 py-2 bg-indigo-600 rounded-lg font-bold text-white hover:bg-indigo-700 hover:text-white h-auto shadow-md shadow-indigo-200 transition-all active:scale-95"
                        >
                            Enregistrer
                        </Button>
                    </div>
                </div>
            </Sheet.Content>
        </Sheet.Root>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <CustomersTable bind:selectedCustomer refreshTrigger={refreshCount} />
    </div>
</div>
