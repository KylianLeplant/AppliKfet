<script lang="ts">
  import { onMount } from "svelte";
  import DataTable from "./data-table.svelte";
  import { columns } from "./columns";
  import { getCustomers, type Customer, initDb } from "$lib/db";

  let customers: Customer[] = $state([]);

  onMount(async () => {
    await initDb();
    customers = await getCustomers();
    console.log("Customers loaded:", customers);
  });
</script>
 
<DataTable data={customers} {columns} />
