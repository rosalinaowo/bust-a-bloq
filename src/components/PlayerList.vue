<script>
import { useGameStore } from '@/stores/game';
import { getOnlineUsers } from '@/scripts/multiplayer';

export default {
  name: 'PlayerList',
  data() {
    return {
      gameStore: useGameStore(),
      onlineUsers: [],
      updateIntervalId: null
    };
  },
  methods: {
    getOnlineUsers,
    connectToOpponent(username) {
      this.gameStore.setOpponent(username).then((result) => {
        if (result !== 'success') {
          console.error('Failed to connect to opponent:', username);
          return;
        }
        console.log(`Connected to opponent: ${username}`);
      }).catch(error => {
        console.error('Error connecting to opponent:', error);
      });
    },
  },
  mounted() {
    this.getOnlineUsers().then(users => {
      this.onlineUsers = users;
    }).catch(error => {
      console.error('Error fetching online users:', error);
      this.onlineUsers = [];
    });

    this.updateIntervalId = setInterval(() => {
      this.getOnlineUsers().then(users => {
        this.onlineUsers = users;
      }).catch(error => {
        console.error('Error fetching online users:', error);
        this.onlineUsers = [];
      });
    }, 2500);
  },
  computed: {
    filteredOnlineUsers() {
      return this.onlineUsers.filter(user => user.username !== this.gameStore.username);
    }
  }
};
</script>

<template>
  <div class="player-list">
    <h3>Online Players</h3>
    <ul>
      <li v-for="user in filteredOnlineUsers" :key="user.username">
        <span class="me-1">{{ user.username }}</span>
        <span class="badge text-bg-info me-1">HIGH: {{ user.maxPoints }}</span>
        <span v-if="user.isBusy" class="badge text-bg-danger">Busy</span>
        <span v-else @click="connectToOpponent(user.username)" class="badge text-bg-success" style="cursor: pointer;">Connect</span>
      </li>
    </ul>
  </div>
</template>