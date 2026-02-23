<script lang="ts">
  import CustomersTable from './CustomersTable.svelte';
  import { type Customer } from "$lib/db";

  let { onStartOrder }: { onStartOrder: (customer: Customer) => void } = $props();
  let selectedCustomer = $state<Customer | null>(null);
</script>

<div class="flex flex-col gap-6 w-full max-w-6xl">
    <div class="flex justify-between items-end">
        <div class="flex flex-col gap-4">
            <div>
                <h1 class="text-3xl font-bold text-white">Gestion des Clients</h1>
                <p class="text-gray-200">Sélectionnez un client dans la liste pour commencer une commande</p>
            </div>
            
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
        </div>
        
        
    </div>

    <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <CustomersTable bind:selectedCustomer />
    </div>
</div>
