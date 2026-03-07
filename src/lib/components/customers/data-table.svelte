<script lang="ts" generics="TData, TValue">
  import { 
    type ColumnDef, 
    getCoreRowModel, 
    getFilteredRowModel, 
    getSortedRowModel,
    getPaginationRowModel,
    type ColumnFiltersState,
    type SortingState,
    type PaginationState 
  } from "@tanstack/table-core";
  import {
    createSvelteTable,
    FlexRender,
  } from "$lib/components/ui/data-table/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button";
  
  type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    columnFilters?: ColumnFiltersState;
    selectedRowId?: string | null;
    onRowClick?: (row: TData) => void;
  };
 
  let { 
    data, 
    columns, 
    columnFilters = $bindable([]),
    selectedRowId = $bindable(null),
    onRowClick
  }: DataTableProps<TData, TValue> = $props();
 
  let sorting = $state<SortingState>([]);
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 50 });
  
  const table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: (updater) => {
      if (typeof updater === "function") {
        columnFilters = updater(columnFilters);
      } else {
        columnFilters = updater;
      }
    },
    onSortingChange: (updater) => {
      if (typeof updater === "function") {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }
    },
    onPaginationChange: (updater) => {
        if (typeof updater === "function") {
            pagination = updater(pagination);
        } else {
            pagination = updater;
        }
    },
    state: {
      get columnFilters() {
        return columnFilters;
      },
      get sorting() {
        return sorting;
      },
      get pagination() {
          return pagination;
      },
    }
  });
</script>
 
<div class="rounded-md border overflow-x-auto">
  <Table.Root class="min-w-full">
    <Table.Header>
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head colspan={header.colSpan}>
              {#if !header.isPlaceholder}
                <FlexRender
                  content={header.column.columnDef.header}
                  context={header.getContext()}
                />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row 
          data-state={(row.id === selectedRowId) && "selected"}
          class="cursor-pointer transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted data-[state=selected]:font-medium"
          onclick={() => {
            selectedRowId = row.id;
            onRowClick?.(row.original);
          }}
        >
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender
                content={cell.column.columnDef.cell}
                context={cell.getContext()}
              />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length} class="h-24 text-center">
            No results.
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
<div class="flex items-center justify-end space-x-2 py-4">
    <div class="flex-1 text-sm text-muted-foreground text-center">
        Page {table.getState().pagination.pageIndex + 1} sur{" "}
        {table.getPageCount()}
    </div>
    <Button
        variant="outline"
        size="sm"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
    >
        Précédent
    </Button>
    <Button
        variant="outline"
        size="sm"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
    >
        Suivant
    </Button>
</div>