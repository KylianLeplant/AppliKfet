<script lang="ts">
  import type { Column } from "@tanstack/table-core";
  import type { Customer } from "$lib/db/schema";
  import { Button } from "$lib/components/ui/button/index.js";
  import { ArrowUpDown, ArrowUp, ArrowDown } from "@lucide/svelte";

  let { column, title }: { column: Column<Customer, unknown>, title: string } = $props();

  function toggleSort() {
    column.toggleSorting(column.getIsSorted() === "asc");
  }
</script>

<Button variant="ghost" onclick={toggleSort} class="-ml-4 hover:bg-transparent">
  {title}
  {#if column.getIsSorted() === "asc"}
    <ArrowUp class="ml-2 h-4 w-4" />
  {:else}
    {#if column.getIsSorted() === "desc"}
      <ArrowDown class="ml-2 h-4 w-4" />
    {:else}
      <ArrowUpDown class="ml-2 h-4 w-4 text-muted-foreground/50" />
    {/if}
  {/if}
</Button>
