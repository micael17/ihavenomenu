<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <img
    src="/logo.svg"
    alt="I Have No Menu"
    :class="{
      'h-6': size === 'sm',
      'h-8': size === 'md' || !size,
      'h-10': size === 'lg',
    }"
    class="w-auto"
  />
</template>
