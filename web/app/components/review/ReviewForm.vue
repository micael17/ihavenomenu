<script setup lang="ts">
const props = defineProps<{
  isSubmitting: boolean
  submitError: string
}>()

const emit = defineEmits<{
  submit: [data: { rating: number; content?: string; photoUrls?: string[] }]
  cancel: []
}>()

const { t } = useI18n()

const rating = ref(0)
const content = ref('')
const photoUrls = ref<string[]>([])
const newPhotoUrl = ref('')
const ratingError = ref(false)

function addPhoto() {
  const url = newPhotoUrl.value.trim()
  if (!url || !url.startsWith('https://') || photoUrls.value.length >= 3) return
  photoUrls.value.push(url)
  newPhotoUrl.value = ''
}

function removePhoto(index: number) {
  photoUrls.value.splice(index, 1)
}

function handleSubmit() {
  if (rating.value === 0) {
    ratingError.value = true
    return
  }
  ratingError.value = false

  emit('submit', {
    rating: rating.value,
    content: content.value.trim() || undefined,
    photoUrls: photoUrls.value.length > 0 ? photoUrls.value : undefined
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- 별점 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('review.ratingLabel') }} *</label>
      <ReviewStarRating v-model="rating" size="lg" />
      <p v-if="ratingError" class="text-red-500 text-xs mt-1">{{ t('review.ratingRequired') }}</p>
    </div>

    <!-- 내용 -->
    <div>
      <textarea
        v-model="content"
        :placeholder="t('review.contentPlaceholder')"
        rows="3"
        maxlength="2000"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>

    <!-- 사진 URL -->
    <div>
      <div class="flex gap-2">
        <input
          v-model="newPhotoUrl"
          type="url"
          :placeholder="t('review.photoUrlPlaceholder')"
          :disabled="photoUrls.length >= 3"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100"
          @keydown.enter.prevent="addPhoto"
        />
        <button
          type="button"
          @click="addPhoto"
          :disabled="photoUrls.length >= 3 || !newPhotoUrl.trim()"
          class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ t('review.addPhoto') }}
        </button>
      </div>
      <p v-if="photoUrls.length > 0" class="text-xs text-gray-400 mt-1">{{ t('review.photoLimit') }}</p>

      <!-- 추가된 사진 미리보기 -->
      <div v-if="photoUrls.length > 0" class="flex gap-2 mt-2">
        <div v-for="(url, index) in photoUrls" :key="index" class="relative w-20 h-20">
          <img :src="url" class="w-full h-full object-cover rounded-lg bg-gray-100" />
          <button
            type="button"
            @click="removePhoto(index)"
            class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
          >
            &times;
          </button>
        </div>
      </div>
    </div>

    <!-- 에러 메시지 -->
    <p v-if="submitError" class="text-red-500 text-sm">{{ submitError }}</p>

    <!-- 버튼 -->
    <div class="flex gap-2">
      <button
        type="submit"
        :disabled="isSubmitting"
        class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? t('review.submitting') : t('review.submit') }}
      </button>
      <button
        type="button"
        @click="emit('cancel')"
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
      >
        {{ t('review.cancel') }}
      </button>
    </div>
  </form>
</template>
