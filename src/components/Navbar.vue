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
          <a href="https://github.com/rosalinaowo/bust-a-bloq" target="_blank">
            <img src="/github-mark-white.svg" alt="Github repo" width="30" height="auto">
          </a>
        </div>
      </div>
    </nav>
</template>

<style>
</style>