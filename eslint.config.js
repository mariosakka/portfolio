import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'docs/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node, __LATEST_COMMIT__: 'readonly', __APP_VERSION__: 'readonly' } } },
  // garden components are intentionally single-word (they become an npm package)
  { files: ['src/garden/**/*.vue'], rules: { 'vue/multi-word-component-names': 'off' } },
)
