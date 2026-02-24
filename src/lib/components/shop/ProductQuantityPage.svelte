<script lang="ts">
    import { type Product, type Customer } from "$lib/db";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Slider } from "$lib/components/ui/slider/index.js";

    let { product, customer, onConfirm, onBack }: { 
        product: Product, 
        customer: Customer | null, 
        onConfirm: (quantity: number, total: number) => void,
        onBack: () => void 
    } = $props();

    let quantityArr = $state([1]);
    let quantity = $derived(quantityArr[0]);

    // Pricing calculation logic
    let totalPrice = $derived.by(() => {
        const q = quantity;
        let unitP = customer?.isKfetier ? product.priceForKfetier : product.price;
        let packP = customer?.isKfetier ? product.priceForThreeKfetier : product.priceForThree;

        // If no specifically defined 3-pack price, use 3 * unit price
        if (packP === null || packP === undefined || packP === 0) {
            packP = unitP * 3;
        }

        const packsOfThree = Math.floor(q / 3);
        const remaining = q % 3;

        return (packsOfThree * packP) + (remaining * unitP);
    });

    let unitPriceLabel = $derived(customer?.isKfetier ? product.priceForKfetier : product.price);
    let packPriceLabel = $derived(customer?.isKfetier ? product.priceForThreeKfetier : product.priceForThree);

</script>

<div class="flex flex-col items-center justify-center gap-8 w-full animate-in fade-in zoom-in-95 duration-300">
    <div class="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <!-- Header with Product Info -->
        <div class="relative h-64 bg-gray-200">
            {#if product.imagePath}
                <img src={product.imagePath} alt={product.name} class="w-full h-full object-cover" />
            {:else}
                <div class="w-full h-full flex items-center justify-center text-gray-400">
                    <span class="text-64px italic">Pas d'image</span>
                </div>
            {/if}
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                <h1 class="text-4xl font-black text-white uppercase tracking-tighter">{product.name}</h1>
                <p class="text-indigo-300 font-bold">
                    Tarif {customer?.isKfetier ? 'Kfetier' : 'Standard'} : {unitPriceLabel.toFixed(2)} €
                    {#if packPriceLabel && packPriceLabel !== 0}
                        <span class="ml-2 text-white/60">({packPriceLabel.toFixed(2)} € les 3)</span>
                    {/if}
                </p>
            </div>
        </div>

        <div class="p-8 space-y-8">
            <!-- Quantity Selection -->
            <div class="space-y-6">
                <div class="flex justify-between items-end">
                    <span class="text-sm font-black text-gray-400 uppercase tracking-widest">Quantité souhaitée</span>
                    <div class="text-6xl font-black text-indigo-600 tabular-nums">
                        {quantity}
                    </div>
                </div>
                
                <div class="py-4">
                    <Slider 
                        type="multiple"
                        bind:value={quantityArr} 
                        min={1} 
                        max={12} 
                        step={1}
                        class="cursor-pointer"
                    />
                    <div class="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                        <span>1</span>
                        <span>12</span>
                    </div>
                </div>
            </div>
            <div class="pt-4">
                <Button 
                    variant="ghost"
                    onclick={() => quantityArr = [1]}
                    class="mt-4 px-6 py-3 h-auto bg-gray-100 border border-gray-400 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-500 transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                    1
                </Button>
                {#if packPriceLabel !== null && packPriceLabel !== 0}
                    <Button 
                        variant="ghost"
                        onclick={() => quantityArr = [3]}
                        class="mt-4 ml-4 px-6 py-3 h-auto bg-gray-100 border border-gray-400 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-500 transition-all active:scale-95 uppercase tracking-widest text-sm"
                    >
                        3
                    </Button>
                {/if}
            </div>
            <!-- Price Recap -->
            <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex justify-between items-center">
                <div>
                    <h2 class="text-xs font-black text-gray-400 uppercase mb-1">Total de la commande</h2>
                    <p class="text-3xl font-black text-gray-800 tabular-nums">{totalPrice.toFixed(2)} €</p>
                </div>
                
                {#if Math.floor(quantity / 3) > 0 && packPriceLabel && packPriceLabel !== 0}
                    <div class="text-right">
                        <span class="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase">
                            Lot de 3 appliqué
                        </span>
                    </div>
                {/if}
            </div>

            <!-- Actions -->
            <div class="flex gap-4 pt-4">
                <Button 
                    variant="ghost"
                    onclick={onBack}
                    class="flex-1 py-4 px-6 h-auto border border-gray-200 rounded-2xl font-black text-gray-500 hover:bg-gray-50 hover:text-gray-500 transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                    Annuler
                </Button>
                <Button 
                    variant="ghost"
                    onclick={() => onConfirm(quantity, totalPrice)}
                    class="flex-[2] py-4 px-6 h-auto bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:text-white transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                    Confirmer l'ajout
                </Button>
            </div>
        </div>
    </div>
</div>
