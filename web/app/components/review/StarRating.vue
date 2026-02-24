<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  modelValue: 0,
  readonly: false,
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverValue = ref(0)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-4 h-4'
    case 'lg': return 'w-7 h-7'
    default: return 'w-5 h-5'
  }
})

function setRating(value: number) {
  if (props.readonly) return
  emit('update:modelValue', value)
}

function setHover(value: number) {
  if (props.readonly) return
  hoverValue.value = value
}

function clearHover() {
  hoverValue.value = 0
}

function isActive(star: number): boolean {
  const current = hoverValue.value || props.modelValue
  return star <= current
}
</script>

<template>
  <div
    class="inline-flex gap-0.5"
    :class="{ 'cursor-pointer': !readonly }"
    @mouseleave="clearHover"
  >
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="readonly"
      @click="setRating(star)"
      @mouseenter="setHover(star)"
      class="focus:outline-none disabled:cursor-default transition-colors"
    >
      <svg
        :class="[sizeClass, isActive(star) ? 'text-yellow-400' : 'text-gray-300']"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  </div>
</template>
