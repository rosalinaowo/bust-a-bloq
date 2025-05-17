<script setup>
import { ref } from 'vue';
import GameField from '@/components/GameField.vue';
import { useGameStore } from '@/stores/game';

var gameStore = useGameStore();
</script>

<template>
  <div class="d-flex justify-content-center">
    <GameField></GameField>
    <div class="ms-3">
      <div>Logged in: {{ gameStore.logged }}</div>
      <div>Opponent name: {{ gameStore.opponentUsername }}</div>
      <input type="text" v-model="gameStore.username" placeholder="Enter username" />
      <button @click="gameStore.login()">Login</button>
      <button @click="gameStore.sendUpdatedField()">Send state</button>
      <button @click="gameStore.updateOpponentState()">Get opponent state</button>
      <br>
      <input type="text" v-model="gameStore.opponentUsername" placeholder="Opponent username" />
      <button @click="gameStore.setOpponent()">Connect</button>
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