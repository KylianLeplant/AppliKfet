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

<div class="flex flex-col items-center w-full">
    <div class="w-full max-w-xl bg-white rounded-lg border border-slate-200 overflow-hidden">
        <!-- Image -->
        <div class="relative h-48 bg-slate-100">
            {#if product.imagePath}
                <img src={product.imagePath} alt={product.name} class="w-full h-full object-cover" />
            {:else}
                <div class="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    Pas d'image
                </div>
            {/if}
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h1 class="text-2xl font-semibold text-white">{product.name}</h1>
                <p class="text-sm text-slate-300">
                    {unitPriceLabel.toFixed(2)} € {customer?.isKfetier ? '(Kfetier)' : ''}
                    {#if packPriceLabel && packPriceLabel !== 0}
                        · {packPriceLabel.toFixed(2)} € les 3
                    {/if}
                </p>
            </div>
        </div>

        <div class="p-6 space-y-6">
            <!-- Quantité -->
            <div class="space-y-4">
                {#if customer}
                    <p class="text-md text-slate-800 mt-1">Client : {customer.firstName} {customer.lastName}</p>
                {/if}
                <div class="flex justify-between items-end">
                    <span class="text-sm text-slate-500">Quantité</span>
                    <span class="text-4xl font-semibold text-slate-800 tabular-nums">{quantity}</span>
                </div>
                
                <Slider 
                    type="multiple"
                    bind:value={quantityArr} 
                    min={1} 
                    max={12} 
                    step={1}
                    class="cursor-pointer"
                />
                <div class="flex justify-between text-xs text-slate-400">
                    <span>1</span>
                    <span>12</span>
                </div>

                <div class="flex gap-2">
                    <Button 
                        variant="outline"
                        size="sm"
                        onclick={() => quantityArr = [1]}
                    >
                        1
                    </Button>
                    {#if packPriceLabel !== null && packPriceLabel !== 0}
                        <Button 
                            variant="outline"
                            size="sm"
                            onclick={() => quantityArr = [3]}
                        >
                            3
                        </Button>
                    {/if}
                </div>
            </div>

            <!-- Total -->
            <div class="bg-slate-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                    <p class="text-sm text-slate-500">Total</p>
                    <p class="text-2xl font-semibold text-slate-800 tabular-nums">{totalPrice.toFixed(2)} €</p>
                </div>
                {#if Math.floor(quantity / 3) > 0 && packPriceLabel && packPriceLabel !== 0}
                    <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Lot de 3
                    </span>
                {/if}
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <Button 
                    variant="outline"
                    onclick={onBack}
                    class="flex-1"
                >
                    Annuler
                </Button>
                <Button 
                    onclick={() => onConfirm(quantity, totalPrice)}
                    class="flex-[2]"
                >
                    Confirmer
                </Button>
            </div>
        </div>
    </div>
</div>
