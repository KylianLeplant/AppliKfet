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
    <div class="flex justify-between items-end">
        <div>
            <h1 class="text-3xl font-bold text-white">{productCategory.name}</h1>
            <p class="text-gray-200">Choisissez un produit à ajouter au panier</p>
        </div>
        {#if customer}
            <div class="bg-indigo-600/50 backdrop-blur-md px-4 py-2 rounded-lg border border-indigo-200/30">
                <span class="text-indigo-100 text-sm">Client :</span>
                <span class="text-white font-bold ml-2">{customer.firstName} {customer.lastName}</span>
            </div>
        {/if}
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
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