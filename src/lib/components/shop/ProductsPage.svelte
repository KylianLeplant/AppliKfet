<script lang="ts">
    import { onMount } from "svelte";
    import { getProducts, type Product, type ProductCategory } from "$lib/db";
    import ItemCard from "../itemCard/ItemCard.svelte";

    let { productCategory }: { productCategory: ProductCategory } = $props();

    let productsResult = $state<Product[]>([]);

    onMount(async () => {
        productsResult = (await getProducts(productCategory.id)) as Product[];
    });
</script>

<div class="space-y-4">
    <h1 class="text-2xl font-bold text-white">{productCategory.name}</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each productsResult as product}
            <ItemCard 
                name={product.name} 
                imagePath={product.imagePath} 
                onclick={() => {
                    console.log("Product clicked:", product.name);
                }} 
            />
        {/each}
    </div>
</div>