import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Suppressed: GAS backend returns untyped JSON; full typing is impractical
      '@typescript-eslint/no-explicit-any': 'off',
      // Downgraded: legitimate init patterns (loading data on mount, resetting state on deps change)
      'react-hooks/set-state-in-effect': 'warn',
      // Downgraded: Date.now() in useMemo is technically impure but stable for component lifetime
      'react-hooks/purity': 'warn',
    },
  },
])
