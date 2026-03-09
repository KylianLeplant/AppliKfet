import type { ColumnDef } from "@tanstack/table-core";
import SortButton from "$lib/components/customers/SortButton.svelte";
import { renderComponent } from "$lib/components/ui/data-table/index.js";

export type OrderRow = {
  id: number;
  customerName: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string | null;
};

function safeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

export const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => renderComponent(SortButton, { column, title: "#" }),
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Client" }),
    cell: ({ getValue }) => safeValue(getValue()),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Produit" }),
    cell: ({ getValue }) => safeValue(getValue()),
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Quantité" }),
    cell: ({ getValue }) => safeValue(getValue()),
  },
  {
    accessorKey: "totalPrice",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Total" }),
    cell: ({ getValue }) => {
      const amount = Number(getValue() ?? 0);
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => renderComponent(SortButton, { column, title: "Date" }),
    cell: ({ getValue }) => {
      const rawDate = getValue();
      if (!rawDate) return "-";
      const date = new Date(String(rawDate));
      if (Number.isNaN(date.getTime())) {
        return safeValue(rawDate);
      }
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
    },
  },
];
