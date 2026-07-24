<template>
  <Toaster
    richColors
    position="top-right"
    :expand="false"
    :visible-toasts="5"
    :duration="3000"
    :gap="8"
    :toast-options="{
      class: 'sonner-toast',
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        border: '1px solid var(--outline-variant)',
        background: 'var(--surface-container-high)',
        color: 'var(--on-surface)',
      },
    }"
  />
</template>

<script setup>
import 'vue-sonner/style.css';
import { Toaster } from 'vue-sonner';
</script>
