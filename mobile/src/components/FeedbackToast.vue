<template>
  <Transition name="fade">
    <div v-if="visible" :class="['fixed bottom-6 left-4 right-4 px-4 py-3 rounded-lg text-sm text-center shadow-lg', bgClass]">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'success' },
});

const visible = ref(false);
const bgClass = ref('bg-green-600 text-white');

watch(() => props.message, (val) => {
  if (val) {
    bgClass.value = props.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white';
    visible.value = true;
    setTimeout(() => { visible.value = false; }, 3000);
  }
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
