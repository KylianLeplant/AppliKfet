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
            <h1 class="text-2xl sm:text-3xl font-bold text-white">Catalogue</h1>
            <p class="text-sm sm:text-base text-gray-200">Choisissez une catégorie pour votre commande</p>
        </div>
        {#if customer}
            <div class="bg-indigo-600/50 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-indigo-200/30">
                <span class="text-indigo-100 text-xs sm:text-sm">Client :</span>
                <span class="text-white font-bold ml-2 text-sm sm:text-base">{customer.firstName} {customer.lastName}</span>
            </div>
        {/if}
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
        {#each productsCategoriesResult as category}
            <ItemCard 
                name={category.name} 
                imagePath={category.imagePath} 
                onclick={() => onCategorySelect(category)} 
            />
        {/each}
    </div>
</div>