<script lang="ts">
    import { onMount } from "svelte";
    import { getProductsCategories, type ProductCategory, type Customer } from "$lib/db";
    import ItemCard from "../itemCard/ItemCard.svelte";

    let { onCategorySelect, customer }: { 
        onCategorySelect: (category: ProductCategory) => void,
        customer: Customer | null 
    } = $props();

    let productsCategoriesResult = $state<ProductCategory[]>([]);

    onMount(async () => {
        productsCategoriesResult = await getProductsCategories() as ProductCategory[];
    });
</script>

<div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
            <h1 class="text-2xl font-semibold text-slate-800">Catalogue</h1>
            <p class="text-sm text-slate-500">Choisissez une catégorie</p>
        </div>
        {#if customer}
            <span class="text-sm text-slate-600">
                Client : <strong>{customer.firstName} {customer.lastName}</strong>
            </span>
        {/if}
    </div>
    
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {#each productsCategoriesResult as category}
            <ItemCard 
                name={category.name} 
                imagePath={category.imagePath} 
                onclick={() => onCategorySelect(category)} 
            />
        {/each}
    </div>
</div>