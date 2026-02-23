<script lang="ts">
    import { Card } from "$lib/components/ui/card/index.js";
    
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
    tabindex="0"
    class="relative overflow-hidden cursor-pointer aspect-square w-full bg-white transition-transform hover:scale-[1.02] active:scale-95 focus:ring-2 focus:ring-primary focus:outline-none border shadow-sm p-0 flex-none gap-0"
>
    {#if imagePath}
        <div class="absolute inset-0 w-full h-full">
            <img src={imagePath} alt={name} class="w-full h-full object-cover" />
        </div>
    {:else}
        <div class="absolute inset-0 w-full h-full bg-white"></div>
    {/if}
    <div class="bottom-0 w-full bg-black/60 text-white text-center py-2 absolute backdrop-blur-md z-10 transition-all group-hover:bg-black/80">
        <h3 class="font-bold text-sm px-2 truncate">{name}</h3>
        {#if subtitle}
            <p class="text-xs text-indigo-300 font-mono font-bold">{subtitle}</p>
        {/if}
    </div>
</Card>