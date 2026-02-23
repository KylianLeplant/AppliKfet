<script lang="ts">
    import { Card } from "$lib/components/ui/card/index.js";
    
    let { name, imagePath, onclick }: { 
        name: string,
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
    <div class="bottom-0 w-full bg-black/60 text-white text-center py-3 absolute backdrop-blur-md z-10">
        <h3 class="font-bold text-base px-2 truncate">{name}</h3>
    </div>
</Card>