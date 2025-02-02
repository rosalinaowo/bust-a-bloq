<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
</script>

<template>
  <header>
    <Navbar></Navbar>
    <!-- <RouterLink to="/">Home</RouterLink> -->
  </header>

  <RouterView />
</template>

<style scoped>

</style>
