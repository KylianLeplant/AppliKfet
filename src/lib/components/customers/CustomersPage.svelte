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
  import { toast } from "svelte-sonner";

  let { onStartOrder }: { onStartOrder: (customer: Customer) => void } = $props();
  let selectedCustomer = $state<Customer | null>(null);
  let isEditing = $state(false);
  let isAddingMoney = $state(false);
  let isRemovingMoney = $state(false);
  let amountToAdd = $state(0);
  let amountToRemove = $state(0);
  let allCategories = $state<Category[]>([]);
  let refreshCount = $state(0);
  let searchTerm = $state("");
  
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

  async function handleRemoveMoney() {
    if (!selectedCustomer || amountToRemove <= 0) return;
    try {
        await addMoneyToCustomer(selectedCustomer.id, -amountToRemove);
        if (selectedCustomer.account !== null) {
            selectedCustomer.account -= amountToRemove;
        }
        toast.success(`Solde mis à jour`, {
            description: `${amountToRemove}€ retirés du compte de ${selectedCustomer.firstName}`
        });
        isRemovingMoney = false;
        amountToRemove = 0;
        refreshCount++;
    } catch (e) {
        console.error("Error removing money:", e);
        toast.error("Erreur lors du retrait d'argent");
    }
  }
</script>

<div class="space-y-4 w-full">
    <div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div class="space-y-3">
            <div>
                <h1 class="text-2xl font-semibold text-slate-800">Clients</h1>
                <p class="text-sm text-slate-500">Sélectionnez un client pour commencer une commande</p>
            </div>
            
            <div class="flex flex-wrap gap-2">
                <Button 
                    onclick={() => selectedCustomer && onStartOrder(selectedCustomer)}
                    disabled={!selectedCustomer}
                >
                    Passer une commande
                </Button>

                {#if selectedCustomer}
                    <Button 
                        variant="outline"
                        onclick={startEditing}
                    >
                        Modifier
                    </Button>
                    <Button 
                        variant="outline"
                        onclick={() => isAddingMoney = true}
                    >
                        Ajouter de l'argent
                    </Button>
                    <Button 
                        variant="outline"
                        onclick={() => isRemovingMoney = true}
                    >
                        Retirer de l'argent
                    </Button>
                {/if}
            </div>
        </div>
        
        <Dialog.Root bind:open={isAddingMoney}>
            <Dialog.Content class="sm:max-w-[400px]">
                <Dialog.Header>
                    <Dialog.Title>Ajouter du solde</Dialog.Title>
                    <Dialog.Description>
                        {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                    </Dialog.Description>
                </Dialog.Header>
                <div class="space-y-4 py-2">
                    <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                        <span class="text-sm text-slate-500">Solde actuel</span>
                        <span class="text-lg font-semibold">{selectedCustomer?.account?.toFixed(2)} €</span>
                    </div>
                    
                    <div class="space-y-1">
                        <Label for="amount">Montant (€)</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            bind:value={amountToAdd} 
                            placeholder="5.00" 
                            min="0.01" 
                            step="0.01"
                        />
                    </div>

                    <div class="flex gap-2 pt-2">
                        <Button 
                            variant="outline"
                            onclick={() => isAddingMoney = false}
                            class="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button 
                            onclick={handleAddMoney}
                            class="flex-1"
                        >
                            Confirmer (+{amountToAdd}€)
                        </Button>
                    </div>
                </div>
            </Dialog.Content>
        </Dialog.Root>

        <Dialog.Root bind:open={isRemovingMoney}>
            <Dialog.Content class="sm:max-w-[400px]">
                <Dialog.Header>
                    <Dialog.Title>Retirer du solde</Dialog.Title>
                    <Dialog.Description>
                        {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                    </Dialog.Description>
                </Dialog.Header>
                <div class="space-y-4 py-2">
                    <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                        <span class="text-sm text-slate-500">Solde actuel</span>
                        <span class="text-lg font-semibold">{selectedCustomer?.account?.toFixed(2)} €</span>
                    </div>
                    
                    <div class="space-y-1">
                        <Label for="amount-remove">Montant (€)</Label>
                        <Input 
                            id="amount-remove" 
                            type="number" 
                            bind:value={amountToRemove} 
                            placeholder="5.00" 
                            min="0.01" 
                            step="0.01"
                        />
                    </div>

                    <div class="flex gap-2 pt-2">
                        <Button 
                            variant="outline"
                            onclick={() => isRemovingMoney = false}
                            class="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button 
                            variant="destructive"
                            onclick={handleRemoveMoney}
                            class="flex-1"
                        >
                            Confirmer (-{amountToRemove}€)
                        </Button>
                    </div>
                </div>
            </Dialog.Content>
        </Dialog.Root>

        <Sheet.Root bind:open={isEditing}>
            <Sheet.Content side="right" class="w-[400px] sm:w-[480px] p-6 overflow-y-auto">
                <Sheet.Header class="mb-6">
                    <Sheet.Title>Modifier le client</Sheet.Title>
                </Sheet.Header>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <Label for="fn">Prénom</Label>
                            <Input id="fn" bind:value={editFirstName} />
                        </div>
                        <div class="space-y-1">
                            <Label for="ln">Nom</Label>
                            <Input id="ln" bind:value={editLastName} />
                        </div>
                    </div>

                    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Checkbox 
                            id="isk" 
                            bind:checked={editIsKfetier}
                        />
                        <Label for="isk" class="cursor-pointer">Compte Kfétier</Label>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <Label for="edit-dept">Département</Label>
                            <Select.Root type="single" bind:value={editDept}>
                                <Select.Trigger id="edit-dept" class="w-full">
                                    {editDept || "Dépt."}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each allUniqueDepts as dept}
                                        <Select.Item value={dept}>{dept}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                        <div class="space-y-1">
                            <Label for="edit-year">Année</Label>
                            <Select.Root type="single" bind:value={editYear}>
                                <Select.Trigger id="edit-year" class="w-full">
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

                    <div class="flex gap-2 pt-4 border-t">
                        <Button 
                            variant="outline"
                            onclick={() => isEditing = false}
                            class="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button 
                            onclick={handleSave}
                            class="flex-1"
                        >
                            Enregistrer
                        </Button>
                    </div>
                </div>
            </Sheet.Content>
        </Sheet.Root>
    </div>

    <div class="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
        <Input
          placeholder="Rechercher nom/prénom..."
          bind:value={searchTerm}
        />
        <CustomersTable bind:selectedCustomer refreshTrigger={refreshCount} bind:searchTerm />
    </div>
</div>
