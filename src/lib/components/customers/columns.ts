import type { ColumnDef } from "@tanstack/table-core";
import type { Customer } from "$lib/db";
import SortButton from "./SortButton.svelte";
import { renderComponent } from "$lib/components/ui/data-table/index.js";

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "lastName",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Nom" }),
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Prénom" }),
  },
  // Colonnes ajoutées pour Category
  {
    accessorKey: "dept",
    header: "Département",
    cell: ({ row }) => {
      return row.original.dept ?? "-";
    },
    filterFn: "equals"
  },
  {
    accessorKey: "year",
    header: "Année",
    cell: ({ row }) => {
      return row.original.year ?? "-";
    },
    filterFn: "equals"
  },
  {
    accessorKey: "isKfetier",
    header: "Kfétier",
    cell: ({ getValue }) => {
      return getValue() ? "Oui" : "Non";
    },
    filterFn: (row, columnId, value) => {
      if (value === null || value === undefined) return true;
      return (row.getValue(columnId) === true) === value;
    }
  },
  {
    accessorKey: "account",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Solde" }),
    cell: ({ getValue }) => {
      const amount = parseFloat(getValue() as string ?? "0");
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    },
  }
];