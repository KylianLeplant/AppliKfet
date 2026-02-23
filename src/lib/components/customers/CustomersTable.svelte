<script lang="ts">
  import { onMount } from "svelte";
  import DataTable from "./data-table.svelte";
  import { columns } from "./columns";
  import { getCustomers, getDepts, getYears, type Customer, initDb } from "$lib/db";
  import type { ColumnFiltersState } from "@tanstack/table-core";

  let { 
    selectedCustomer = $bindable(null),
    refreshTrigger = 0 
  }: { 
    selectedCustomer?: Customer | null,
    refreshTrigger?: number 
  } = $props();

  let customers: Customer[] = $state([]);
  let depts: string[] = $state([]);
  let years: string[] = $state([]);
  let columnFilters = $state<ColumnFiltersState>([]);
  let selectedRowId = $state<string | null>(null);

  $effect(() => {
    if (!selectedCustomer) {
      selectedRowId = null;
    }
  });

  async function loadData() {
    customers = await getCustomers();
    depts = await getDepts();
    years = await getYears();
  }

  // Refresh every time refreshTrigger changes
  $effect(() => {
    refreshTrigger;
    loadData();
  });

  function handleFilterChange(columnId: string, value: any) {
    const existing = columnFilters.find(f => f.id === columnId);
    
    if (value === "all" || value === false && columnId === "isKfetier") {
      columnFilters = columnFilters.filter(f => f.id !== columnId);
    } else {
      if (existing) {
        columnFilters = columnFilters.map(f => f.id === columnId ? { ...f, value } : f);
      } else {
        columnFilters = [...columnFilters, { id: columnId, value }];
      }
    }
  }

  function handleKfetierChange(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    handleFilterChange("isKfetier", checked ? true : false);
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Clients</h1>
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="kfetier-filter"
          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          onchange={handleKfetierChange}
        />
        <label for="kfetier-filter" class="text-sm font-medium cursor-pointer">
          Kfétiers uniquement
        </label>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Département :</span>
        <select 
          class="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          onchange={(e) => handleFilterChange("dept", (e.target as HTMLSelectElement).value)}
        >
          <option value="all">Tous</option>
          {#each depts as dept}
            <option value={dept}>{dept}</option>
          {/each}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Année :</span>
        <select 
          class="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          onchange={(e) => handleFilterChange("year", (e.target as HTMLSelectElement).value)}
        >
          <option value="all">Toutes</option>
          {#each years as year}
            <option value={year}>{year}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <DataTable 
    data={customers} 
    {columns} 
    bind:columnFilters 
    bind:selectedRowId
    onRowClick={(customer) => selectedCustomer = customer}
  />
</div>
