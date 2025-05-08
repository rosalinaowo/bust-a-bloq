<script setup>
import { PixiGame } from '@/scripts/graphics';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const gameContainer = ref(null);
let pixiGame = null;

onMounted(() => {
    if (gameContainer.value) {
        pixiGame = new PixiGame(gameContainer.value);
    }
});

onUnmounted(() => {
    if (pixiGame) {
        pixiGame.destroy();
    }
});
</script>

<template>
    <div ref="gameContainer"></div>
</template>

<style>
</style>