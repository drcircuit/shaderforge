import * as monaco from 'monaco-editor';
import { languages } from 'monaco-editor';

// Register both GLSL and WGSL languages
monaco.languages.register({ id: 'glsl' });
monaco.languages.register({ id: 'wgsl' });

// GLSL configuration
monaco.languages.setMonarchTokensProvider('glsl', {
  tokenizer: {
    root: [
      [/[0-9]+\.[0-9]*/, 'number.float'],
      [/[0-9]+/, 'number'],
      [/\b(void|float|vec2|vec3|vec4|mat2|mat3|mat4|sampler2D|samplerCube)\b/, 'type'],
      [/\b(if|else|for|while|do|break|continue|return)\b/, 'keyword.control'],
      [/\b(precision|highp|mediump|lowp)\b/, 'keyword'],
      [/#(version|extension|pragma)/, 'keyword.directive'],
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      [/[a-zA-Z_]\w*/, 'identifier'],
    ],
    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment']
    ]
  }
});

// WGSL configuration
monaco.languages.setMonarchTokensProvider('wgsl', {
  tokenizer: {
    root: [
      // Numbers
      [/[0-9]+\.[0-9]*/, 'number.float'],
      [/[0-9]+/, 'number'],
      
      // Types
      [/\b(f32|i32|u32|vec2|vec3|vec4|mat2x2|mat3x3|mat4x4|array|struct|texture_2d|sampler|bool)\b/, 'type'],
      
      // Storage classes and address spaces
      [/\b(uniform|storage|workgroup|private|function)\b/, 'storage.class'],
      
      // Keywords
      [/\b(var|let|fn|return|if|else|switch|case|default|loop|for|while|break|continue)\b/, 'keyword.control'],
      
      // Special qualifiers
      [/\b(@builtin|@location|@binding|@group|@stage)\b/, 'keyword.directive'],
      
      // Built-in values and functions
      [/\b(position|vertex_index|instance_index|local_invocation_id|workgroup_size)\b/, 'keyword.builtin'],
      [/\b(dot|normalize|cross|min|max|clamp|mix|step|smoothstep|length|distance|reflect|refract)\b/, 'keyword.function'],
      
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      
      // Identifiers
      [/[a-zA-Z_]\w*/, 'identifier'],
      
      // Operators
      [/[+\-*/<>=!&|^~]/, 'operator'],
    ],
    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment']
    ]
  }
});

// Update theme to include WGSL-specific tokens
monaco.editor.defineTheme('shaderforge-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'type', foreground: '569CD6' },          // Types in blue
    { token: 'keyword.control', foreground: 'C586C0' }, // Control flow in purple
    { token: 'keyword.directive', foreground: 'D4D4D4' }, // Decorators in light grey
    { token: 'keyword.builtin', foreground: '4EC9B0' },  // Built-in values in teal
    { token: 'keyword.function', foreground: 'DCDCAA' }, // Built-in functions in gold
    { token: 'number', foreground: 'B5CEA8' },         // Numbers in light green
    { token: 'number.float', foreground: 'B5CEA8' },   // Float numbers in light green
    { token: 'storage.class', foreground: '569CD6' },  // Storage classes in blue
    { token: 'comment', foreground: '6A9955' },        // Comments in green
    { token: 'operator', foreground: 'D4D4D4' },       // Operators in light grey
    { token: 'identifier', foreground: '9CDCFE' }      // Variables in light blue
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.lineHighlightBackground': '#2D2D30',
    'editorCursor.foreground': '#AEAFAD',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41'
  }
});

export default monaco;