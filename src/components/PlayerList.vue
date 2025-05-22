<script>
import { getOnlineUsers } from '@/scripts/multiplayer';

export default {
  name: 'PlayerList',
  data() {
    return {
      onlineUsers: [],
    };
  },
  methods: {
    getOnlineUsers
  },
  mounted() {
    this.fetchOnlineUsers();
  },
};
</script>

<template>
    
</template>