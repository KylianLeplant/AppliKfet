<script lang="ts">
  import type { Column } from "@tanstack/table-core";
  import type { Customer } from "$lib/db/schema";
  import { getDepts } from "$lib/db";
  import { onMount } from "svelte";
  import * as Select from '../ui/select';

  let { column }: { column: Column<Customer, unknown> } = $props();
  let depts = $state<string[]>([]);
  let showFilter = $state(false);
  let selectedValue = $state<string>((column.getFilterValue() as string) ?? "all");

  onMount(async () => {
    depts = await getDepts();
  });

  function handleValueChange(value: string) {
    selectedValue = value;
    column.setFilterValue(value === "all" ? undefined : value);
  }

  function toggleFilter(e: MouseEvent) {
    const target = e.target as HTMLElement;
    // On ne ferme pas si on clique sur le trigger du select
    if (!target.closest('[role="combobox"]')) {
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
      <Select.Root type="single" bind:value={selectedValue} onValueChange={handleValueChange}>
        <Select.Trigger class="h-7 text-xs font-normal min-w-[100px] px-2 py-1">
          {selectedValue === "all" ? "Tous" : selectedValue}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="all">Tous</Select.Item>
          {#each depts as dept}
            <Select.Item value={dept}>{dept}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  {/if}
</div>
