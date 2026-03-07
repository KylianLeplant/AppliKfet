<script lang="ts">
    import { onMount } from "svelte";
    import { getProducts, type Product, type ProductCategory, type Customer } from "$lib/db";
    import ItemCard from "../itemCard/ItemCard.svelte";

    let { 
        productCategory, 
        customer, 
        onProductSelect 
    }: { 
        productCategory: ProductCategory, 
        customer: Customer | null,
        onProductSelect: (product: Product) => void
    } = $props();

    let productsResult = $state<Product[]>([]);

    onMount(async () => {
        productsResult = (await getProducts(productCategory.id)) as Product[];
    });

    function getPrice(product: Product) {
        if (customer?.isKfetier) {
            return `${product.priceForKfetier.toFixed(2)} € (Kfetier)`;
        }
        return `${product.price.toFixed(2)} €`;
    }
</script>

<div class="space-y-4 px-2 sm:px-4 md:px-0">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white">{productCategory.name}</h1>
            <p class="text-sm sm:text-base text-gray-200">Choisissez un produit à ajouter au panier</p>
        </div>
        {#if customer}
            <div class="bg-indigo-600/50 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-indigo-200/30">
                <span class="text-indigo-100 text-xs sm:text-sm">Client :</span>
                <span class="text-white font-bold ml-2 text-sm sm:text-base">{customer.firstName} {customer.lastName}</span>
            </div>
        {/if}
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-4">
        {#each productsResult as product}
            <ItemCard 
                name={product.name} 
                subtitle={getPrice(product)}
                imagePath={product.imagePath} 
                onclick={() => onProductSelect(product)} 
            />
        {/each}
    </div>
</div>