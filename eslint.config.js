import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/', 'node_modules/', 'docs/'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  { languageOptions: { globals: { ...globals.browser, ...globals.node, __LATEST_COMMIT__: 'readonly' } } },
  // garden components are intentionally single-word (they become an npm package)
  { files: ['src/garden/**/*.vue'], rules: { 'vue/multi-word-component-names': 'off' } },
]
