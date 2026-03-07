<script lang="ts">
  import { onMount } from "svelte";
  import DataTable from "./data-table.svelte";
  import { columns } from "./columns";
  import { getCustomers, getDepts, getYears, type Customer, initDb } from "$lib/db";
  import type { ColumnFiltersState } from "@tanstack/table-core";
  import { Checkbox } from '../ui/checkbox';
  import { Label } from '../ui/label';
  import * as Select from '../ui/select';

  let { 
    selectedCustomer = $bindable(null),
    refreshTrigger = 0,
    searchTerm = $bindable("")
  }: { 
    selectedCustomer?: Customer | null,
    refreshTrigger?: number,
    searchTerm?: string
  } = $props();

  let customers: Customer[] = $state([]);
  let depts: string[] = $state([]);
  let years: string[] = $state([]);
  let columnFilters = $state<ColumnFiltersState>([
    { id: "categoryName", value: true }
  ]);
  let selectedRowId = $state<string | null>(null);

  let filteredCustomers = $derived(
    searchTerm 
      ? customers.filter(c => 
          (c.firstName?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
          (c.lastName?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
        )
      : customers
  );

  $effect(() => {
    if (!selectedCustomer) {
      selectedRowId = null;
    }
  });

  $effect(() => {
    const normalizedSearch = searchTerm.trim();

    if (normalizedSearch.length > 0 && filteredCustomers.length === 1) {
      selectedCustomer = filteredCustomers[0];
      selectedRowId = "0";
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
    
    if (value === "all" || (value === false && ["isKfetier", "categoryName"].includes(columnId))) {
      columnFilters = columnFilters.filter(f => f.id !== columnId);
    } else {
      if (existing) {
        columnFilters = columnFilters.map(f => f.id === columnId ? { ...f, value } : f);
      } else {
        columnFilters = [...columnFilters, { id: columnId, value }];
      }
    }
  }

  let isKfetierFilter = $state(false);
  let isHideSaveFilter = $state(true);
  let selectedDept = $state("all");
  let selectedYear = $state("all");
  
  // On utilise une fonction classique au lieu d'un $effect pour éviter 
  // que le filtre ne s'applique au montage initial avant que les données soient prêtes
  function handleKfetierChange(checked: boolean) {
    isKfetierFilter = checked;
    handleFilterChange("isKfetier", checked ? true : false);
  }

  function handleHideSaveChange(checked: boolean) {
    isHideSaveFilter = checked;
    handleFilterChange("categoryName", checked ? true : false);
  }

  function handleDeptChange(value: string) {
    selectedDept = value;
    handleFilterChange("dept", value);
  }

  function handleYearChange(value: string) {
    selectedYear = value;
    handleFilterChange("year", value);
  }
</script>

<div class="space-y-4">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <h1 class="text-xl sm:text-2xl font-bold">Clients</h1>
    <div class="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 lg:gap-6">
      <div class="flex items-center gap-2">
        <Checkbox 
          id="kfetier-filter"
          checked={isKfetierFilter}
          onCheckedChange={handleKfetierChange}
          class="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
        />
        <Label for="kfetier-filter" class="text-xs sm:text-sm font-medium cursor-pointer">
          Kfétiers uniquement
        </Label>
      </div>

      <div class="flex items-center gap-2">
        <Checkbox 
          id="hidesave-filter"
          checked={isHideSaveFilter}
          onCheckedChange={handleHideSaveChange}
          class="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
        />
        <Label for="hidesave-filter" class="text-xs sm:text-sm font-medium cursor-pointer">
          Masquer Save
        </Label>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs sm:text-sm font-medium">Département :</span>
        <Select.Root type="single" bind:value={selectedDept} onValueChange={handleDeptChange}>
          <Select.Trigger class="h-8 sm:h-9 w-32 sm:w-40 text-xs sm:text-sm">
            {selectedDept === "all" ? "Tous" : selectedDept}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Tous</Select.Item>
            {#each depts as dept}
              <Select.Item value={dept}>{dept}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs sm:text-sm font-medium">Année :</span>
        <Select.Root type="single" bind:value={selectedYear} onValueChange={handleYearChange}>
          <Select.Trigger class="h-8 sm:h-9 w-32 sm:w-40 text-xs sm:text-sm">
            {selectedYear === "all" ? "Toutes" : selectedYear}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Toutes</Select.Item>
            {#each years as year}
              <Select.Item value={year}>{year}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </div>

  <DataTable 
    data={filteredCustomers} 
    {columns} 
    bind:columnFilters 
    bind:selectedRowId
    onRowClick={(customer) => selectedCustomer = customer}
  />
</div>
