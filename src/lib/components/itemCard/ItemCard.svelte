<script lang="ts">
    import { Card } from "$lib/components/ui/card/index.js";
    import { resolveImageSrc } from "$lib/images";
    
    let { name, subtitle, imagePath, onclick }: { 
        name: string,
        subtitle?: string,
        imagePath: string | null, 
        onclick: () => void 
    } = $props();

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onclick();
        }
    }
</script>

<Card 
    {onclick} 
    onkeydown={handleKeyDown}
    role="button"
    tabindex={0}
    class="relative overflow-hidden cursor-pointer aspect-square w-full bg-white hover:ring-2 hover:ring-slate-300 active:scale-[0.98] focus:ring-2 focus:ring-primary focus:outline-none border border-slate-200 rounded-lg p-0 flex-none gap-0 transition-shadow"
>
    {#if imagePath}
        <div class="absolute inset-0 w-full h-full">
            <img src={resolveImageSrc(imagePath) ?? undefined} alt={name} class="w-full h-full object-cover" />
        </div>
    {:else}
        <div class="absolute inset-0 w-full h-full bg-slate-100"></div>
    {/if}
    <div class="bottom-0 w-full bg-black/60 text-white text-center py-1.5 absolute z-10">
        <h3 class="font-medium text-sm px-2 truncate leading-tight">{name}</h3>
        {#if subtitle}
            <p class="text-xs text-slate-300 mt-0.5">{subtitle}</p>
        {/if}
    </div>
</Card>