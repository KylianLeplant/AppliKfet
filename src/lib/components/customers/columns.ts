import type { ColumnDef } from "@tanstack/table-core";
import type { Customer } from "$lib/db";

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "lastName",
    header: "Nom",
  },
  {
    accessorKey: "firstName",
    header: "Prénom",
  },
  {
    accessorKey: "account",
    header: "Solde",
    cell: ({ getValue }) => {
      const amount = parseFloat(getValue() as string ?? "0");
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    },
  },
  // Colonnes ajoutées pour Category
  {
    accessorKey: "dept",
    header: "Département",
    cell: ({ row }) => {
      return row.original.dept ?? "-";
    }
  },
  {
    accessorKey: "year",
    header: "Année",
    cell: ({ row }) => {
      return row.original.year ?? "-";
    }
  },
  {
    accessorKey: "isKfetier",
    header: "Kfétier",
    cell: ({ getValue }) => {
      return getValue() ? "Oui" : "Non";
    }
  },
];