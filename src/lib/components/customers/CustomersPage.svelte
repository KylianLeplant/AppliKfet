<script lang="ts">
  import CustomersTable from './CustomersTable.svelte';
  import { type Customer } from "$lib/db";

  let selectedCustomer = $state<Customer | null>(null);
</script>

<div class="flex flex-col gap-6 w-full max-w-6xl">
    <div class="flex justify-between items-start">
        <div>
            <h1 class="text-3xl font-bold text-white">Gestion des Clients</h1>
            <p class="text-gray-200">Sélectionnez un client dans la liste pour voir ses détails</p>
        </div>
        
        {#if selectedCustomer}
            <div class="bg-indigo-100 p-4 rounded-lg shadow-inner border border-indigo-200 animate-in fade-in slide-in-from-right-4">
                <h2 class="font-bold text-indigo-900 border-b border-indigo-200 pb-1 mb-2">Fiche Client</h2>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span class="text-indigo-700 font-medium">Nom complet :</span>
                    <span class="font-semibold">{selectedCustomer.lastName} {selectedCustomer.firstName}</span>
                    
                    <span class="text-indigo-700 font-medium">Solde actuel :</span>
                    <span class="font-mono text-indigo-900">{selectedCustomer.account} €</span>
                    
                    {#if selectedCustomer.categoryName}
                        <span class="text-indigo-700 font-medium">Catégorie :</span>
                        <span>{selectedCustomer.categoryName} ({selectedCustomer.dept} {selectedCustomer.year})</span>
                    {/if}
                </div>
                <button 
                    class="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    onclick={() => selectedCustomer = null}
                >
                    Fermer la fiche
                </button>
            </div>
        {:else}
            <div class="bg-gray-100 p-4 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm italic h-[120px] flex items-center justify-center w-[300px]">
                Aucun client sélectionné
            </div>
        {/if}
    </div>

    <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <CustomersTable bind:selectedCustomer />
    </div>
</div>
