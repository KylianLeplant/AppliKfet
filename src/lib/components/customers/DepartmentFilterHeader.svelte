<script lang="ts">
  import type { Column } from "@tanstack/table-core";
  import type { Customer } from "$lib/db/schema";
  import { getDepts } from "$lib/db";
  import { onMount } from "svelte";

  let { column }: { column: Column<Customer, unknown> } = $props();
  let depts = $state<string[]>([]);
  let showFilter = $state(false);

  onMount(async () => {
    depts = await getDepts();
  });

  function handleChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    column.setFilterValue(value === "all" ? undefined : value);
  }

  function toggleFilter(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'SELECT') {
      showFilter = !showFilter;
    }
  }
</script>

<div class="flex flex-col gap-1 items-start cursor-pointer w-full p-1" onclick={toggleFilter} onkeydown={(e) => e.key === "Enter" && toggleFilter(e as any)} role="button" tabindex="0">
  <div class="flex items-center gap-1 font-bold">
    <span>Département</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-filter"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
  </div>
  
  {#if showFilter || column.getFilterValue()}
    <div onclick={(e) => e.stopPropagation()} role="presentation">
      <select 
        class="p-1 rounded bg-background border text-xs font-normal min-w-[100px]" 
        onchange={handleChange}
        value={column.getFilterValue() as string ?? "all"}
      >
        <option value="all">Tous</option>
        {#each depts as dept}
          <option value={dept}>{dept}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>
