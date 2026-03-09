<script lang="ts">
  import { onMount } from "svelte";
  import { Input } from "$lib/components/ui/input";
  import DataTable from "$lib/components/customers/data-table.svelte";
  import { getOrdersWithDetails } from "$lib/db";
  import { columns, type OrderRow } from "./columns";

  let rows = $state<OrderRow[]>([]);
  let searchTerm = $state("");

  const filteredRows = $derived.by(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((order) => {
      return (
        order.customerName.toLowerCase().includes(query) ||
        order.productName.toLowerCase().includes(query) ||
        String(order.id).includes(query)
      );
    });
  });

  async function loadOrders() {
    const data = await getOrdersWithDetails();
    rows = data;
  }

  onMount(loadOrders);
</script>

<div class="space-y-4 w-full">
  <div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Commandes</h1>
      <p class="text-sm text-slate-500">Historique des commandes enregistrées</p>
    </div>

    <div class="w-full lg:w-80">
      <Input
        type="text"
        bind:value={searchTerm}
        placeholder="Rechercher client, produit ou id..."
      />
    </div>
  </div>

  <DataTable data={filteredRows} {columns} />
</div>
