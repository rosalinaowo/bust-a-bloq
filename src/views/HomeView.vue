<script>
import { ref } from 'vue';
import GameField from '@/components/GameField.vue';
import PlayerList from '@/components/PlayerList.vue';
import { useGameStore } from '@/stores/game';

export default {
  name: 'HomeView',
  components: {
    GameField,
    PlayerList
  },
  data() {
    return {
      gameStore: useGameStore(),
      opponentUsername: ''
    };
  }
};
</script>

<template>
  <div class="d-flex justify-content-center">
    <GameField></GameField>
    <div class="ms-3">
      <div>Opponent name: {{ gameStore.opponentUsername }}</div>
      <button @click="gameStore.loginWSS()">Login WSS</button>
      <button @click="gameStore.sendUpdatedField()">Send state</button>
      <button @click="gameStore.updateOpponentState()">Get opponent state</button>
      <br>
      <input type="text" v-model="opponentUsername" placeholder="Opponent username" />
      <button @click="gameStore.setOpponent(opponentUsername)">Connect</button>
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
  <PlayerList v-if="gameStore.logged"></PlayerList>
</template>