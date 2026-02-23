<script lang="ts">
    import { onMount } from "svelte";
    import { getProductsCategories, type ProductCategory } from "$lib/db";
    import ItemCard from "../itemCard/ItemCard.svelte";

    let { onCategorySelect }: { onCategorySelect: (category: ProductCategory) => void } = $props();

    let productsCategoriesResult = $state<ProductCategory[]>([]);

    onMount(async () => {
        productsCategoriesResult = await getProductsCategories() as ProductCategory[];
    });
</script>

<div class="space-y-4">
    <h1 class="text-2xl font-bold text-white">Catalogue</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each productsCategoriesResult as category}
            <ItemCard 
                name={category.name} 
                imagePath={category.imagePath} 
                onclick={() => onCategorySelect(category)} 
            />
        {/each}
    </div>
</div>