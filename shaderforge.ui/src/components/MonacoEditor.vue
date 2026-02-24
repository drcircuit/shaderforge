<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

// Props and emits
const props = defineProps<{
  modelValue: string;
  language: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// Editor refs
const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

// Define the ShaderForge dark theme once
monaco.editor.defineTheme('shaderforge-dark', {
  base: 'vs-dark',
  inherit: false,
  rules: [
    // Background / plain text handled via colors below
    { token: '',                    foreground: 'd4d4d4' },
    // Comments
    { token: 'comment',             foreground: '5c8088', fontStyle: 'italic' },
    // Keywords & storage types
    { token: 'keyword',             foreground: 'eca493' },
    { token: 'storage',             foreground: 'eca493' },
    { token: 'storage.type',        foreground: 'eca493' },
    // Strings
    { token: 'string',              foreground: '999999' },
    // Numbers
    { token: 'number',              foreground: '96d166' },
    { token: 'constant.numeric',    foreground: '96d166' },
    // Constants & language constants
    { token: 'constant.language',   foreground: '56d3c2' },
    // Types / classes
    { token: 'entity.name.type',    foreground: '56d3c2' },
    { token: 'entity.name.class',   foreground: '56d3c2' },
    { token: 'support.type',        foreground: '56d3c2' },
    // Functions & methods
    { token: 'entity.name.function',foreground: 'e0c987' },
    { token: 'support.function',    foreground: 'e0c987' },
    // Variables & properties
    { token: 'variable',            foreground: '6ec2ff' },
    { token: 'variable.other',      foreground: '6ec2ff' },
    { token: 'entity.name.variable',foreground: '6ec2ff' },
    // Operators & punctuation
    { token: 'keyword.operator',    foreground: 'ec714c' },
    { token: 'punctuation',         foreground: 'ec714c' },
  ],
  colors: {
    'editor.background':            '#0a1217',
    'editor.foreground':            '#d4d4d4',
    'editor.lineHighlightBackground':'#112030',
    'editor.selectionBackground':   '#1e3a5f',
    'editorLineNumber.foreground':  '#3a5060',
    'editorLineNumber.activeForeground': '#5c8088',
    'editorCursor.foreground':      '#40c0ff',
    'editorIndentGuide.background': '#1a2a35',
    'editorWidget.background':      '#0d1b24',
    'editorSuggestWidget.background':'#0d1b24',
    'editorSuggestWidget.border':   '#1a3040',
  },
});

// Setup editor
onMounted(() => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language,
      theme: 'shaderforge-dark',
      ...props.options,
    });

    editor.onDidChangeModelContent(() => {
      emit('update:modelValue', editor?.getValue() || '');
    });
  }
});

// Watch for modelValue changes — flush:'post' ensures this runs after the DOM
// update so it never fires on a stale (pre-unmount) editor instance.
watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue);
  }
}, { flush: 'post' });

// Cleanup
onBeforeUnmount(() => {
  editor?.dispose();
  editor = null;
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
</style>