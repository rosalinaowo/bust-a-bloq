<script setup>
import GameField from '@/components/GameField.vue';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();
</script>

<template>
  <div class="d-flex justify-content-center">
    <GameField></GameField>
    <div class="ms-3">
      <div>Game matrix:</div>
      <div v-for="(row, index) in gameStore.field" :key="index">
        {{ row }}
      </div>
      <div>Next pieces:</div>
      <div v-for="(piece, index) in gameStore.nextPieces" :key="index">
        <div v-for="(row, rowIdx) in piece" :key="rowIdx">
          {{ row }}
        </div>
        -----------
      </div>
    </div>
  </div>
</template>
