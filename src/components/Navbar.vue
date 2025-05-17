<script setup>
import { RouterLink } from 'vue-router'
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
        <a class="me-3" style="text-decoration: none;" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Login/Register</a>
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
            <input type="text" class="form-control" id="usernameInput">
          </div>
          <div class="mb-3">
            <label for="passwordInput" class="col-form-label">Password:</label>
            <input type="password" class="form-control" id="passwordInput">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary">Register</button>
          <button type="button" class="btn btn-primary">Login</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
</style>