/**
 * System prompt para el clasificador IA.
 * Se genera dinámicamente desde la configuración centralizada de categorías.
 * Si agregás o cambiás categorías, editá SOLO ../config/categories.js.
 */

import { buildClassifierPrompt } from '../config/categories.js';

export const CLASSIFIER_SYSTEM_PROMPT = buildClassifierPrompt();
