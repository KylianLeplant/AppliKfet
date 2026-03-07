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

<div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
            <h1 class="text-2xl font-semibold text-slate-800">{productCategory.name}</h1>
            <p class="text-sm text-slate-500">Choisissez un produit</p>
        </div>
        {#if customer}
            <span class="text-sm text-slate-600">
                Client : <strong>{customer.firstName} {customer.lastName}</strong>
            </span>
        {/if}
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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