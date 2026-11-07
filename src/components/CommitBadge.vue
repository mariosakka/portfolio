<script setup lang="ts">
const commit = __LATEST_COMMIT__
</script>

<template>
  <p
    v-if="commit"
    class="commit-badge"
  >
    latest commit: {{ commit.sha }} {{ commit.message }}
  </p>
</template>

<style scoped>
.commit-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  color: #7b9bd9;
  margin: 0;
}
</style>
