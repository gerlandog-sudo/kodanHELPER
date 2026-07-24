<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in" @click="close">
    <div
      class="w-full max-w-md rounded-t-2xl p-4 animate-slide-up"
      :style="{
        background: 'var(--surface-container-high)',
        borderTop: '1px solid var(--outline-variant)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
      }"
      @click.stop
    >
      <!-- Handle bar -->
      <div class="w-10 h-1 rounded-full mx-auto mb-4" style="background-color: var(--outline-variant);" />

      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold" style="color: var(--on-background);">Acciones</h3>
        <button @click="close" class="w-8 h-8 flex items-center justify-center rounded-full"
          style="background-color: var(--surface-container-high); color: var(--on-surface-variant);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Item info -->
      <p class="text-sm mb-4 px-1" style="color: var(--on-surface-variant);">
        <strong style="color: var(--on-surface);">{{ item.title }}</strong>
      </p>

      <div class="space-y-2">
        <button @click="handleComplete"
          class="w-full px-4 py-3.5 rounded-xl text-left flex items-center gap-3 transition-all active:scale-[0.98]"
          :style="{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)' }">
          <span class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: rgba(34,197,94,0.15); color: #22c55e;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="flex-1">
            <span class="font-semibold text-sm">Completar</span>
            <span class="text-xs block mt-0.5" style="color: var(--on-surface-variant);">Marcar como terminado</span>
          </span>
        </button>

        <button @click="handleCancel"
          class="w-full px-4 py-3.5 rounded-xl text-left flex items-center gap-3 transition-all active:scale-[0.98]"
          :style="{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)' }">
          <span class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: rgba(239,68,68,0.15); color: #ef4444;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
          <span class="flex-1">
            <span class="font-semibold text-sm">Cancelar / Descartar</span>
            <span class="text-xs block mt-0.5" style="color: var(--on-surface-variant);">Eliminar de la lista activa</span>
          </span>
        </button>

        <div class="h-2" />

        <button @click="close"
          class="w-full px-4 py-3.5 rounded-xl text-left flex items-center gap-3 transition-all active:scale-[0.98]"
          style="background-color: var(--surface); color: var(--on-surface-variant); border: 1px solid var(--outline-variant);">
          <span class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: color-mix(in srgb, var(--on-surface-variant) 10%, transparent); color: var(--on-surface-variant);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </span>
          <span class="font-semibold text-sm">Volver</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, required: true },
});

const emit = defineEmits(['complete', 'cancel', 'close']);

function handleComplete() {
  emit('complete', props.item);
}

function handleCancel() {
  emit('cancel', props.item);
}

function close() {
  emit('close');
}
</script>

<style scoped>
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
</style>
