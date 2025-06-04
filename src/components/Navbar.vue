<script>
import { RouterLink } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { isTokenValid } from '@/scripts/utils';
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle';

export default {
  name: 'Navbar',
  components: {
    RouterLink
  },
  data() {
    return {
      gameStore: useGameStore(),
      username: '',
      password: ''
    }
  },
  methods: {
    isTokenValid,
    async login() {
      let jwt = await this.gameStore.login(this.username, this.password);
      if (jwt) {
        localStorage.setItem('jwt', jwt);
        const loginModal = Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
          loginModal.hide();
          this.username = '';
          this.password = '';
        }
        return true;
      }
      return false;
    },
    async register() {
      let jwt = await this.gameStore.register(this.username, this.password);
      if (jwt) {
        localStorage.setItem('jwt', jwt);
        const loginModal = Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
          loginModal.hide();
          this.username = '';
          this.password = '';
        }
        return true;
      }
      return false;
    }
  }
}
</script>

<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="/favicon.png" alt="Logo" height="40px">
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div class="navbar-nav">
          <RouterLink class="nav-link active" aria-current="page" to="/">Home</RouterLink>
          <RouterLink class="nav-link" to="/about">About</RouterLink>
        </div>
      </div>
      <div class="navbar-text">
        <a v-if="!gameStore.logged" class="me-3" style="text-decoration: none;" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Login/Register</a>
        <span v-else class="me-3">
          <a href="#" style="text-decoration: none;">{{ gameStore.username }}</a>
          <span> – </span>
          <a @click="gameStore.logout()" href="#" style="text-decoration: none;">Logout</a>
        </span>
        <a href="https://github.com/rosalinaowo/bust-a-bloq" target="_blank">
          <img src="/github-mark-white.svg" alt="Github repo" width="30" height="auto">
        </a>
      </div>
    </div>
  </nav>

  <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="loginModalLabel">Login/Register</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="usernameInput" class="col-form-label">Username:</label>
            <input v-model="username" type="text" class="form-control" id="usernameInput">
          </div>
          <div class="mb-3">
            <label for="passwordInput" class="col-form-label">Password:</label>
            <input v-model="password" type="password" class="form-control" id="passwordInput">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button @click="register()" type="button" class="btn btn-primary">Register</button>
          <button @click="login()" type="button" class="btn btn-primary">Login</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
</style>