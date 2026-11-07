<script setup>
defineProps({ code: { type: String, default: '' } })
</script>

<template>
  <pre class="overflow-x-auto rounded-2xl border border-[rgba(127,176,255,.3)] bg-[#06122e] p-4 text-sm text-[#e4edff]"><code>{{ code }}</code></pre>
</template>
