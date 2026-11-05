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
      // --color-ev-teal-light (#59B0C4) is 2.49:1 on white; index.css records
      // that beside the token. It is the DARK-mode link colour, so as an
      // unprefixed text class it fails AA everywhere light mode renders.
      //
      // Three components shipped exactly that way (AuthGate, NotFoundPage,
      // ThreadPage) and 345 passing tests never noticed, because
      // index.contrast.test.ts measures token VALUES and cannot see which
      // class a component reaches for. This closes that gap from the other
      // side: the test guards the palette, this guards the usage.
      //
      // `dark:text-ev-teal-light` is fine and is what the lookbehind allows.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/(?<!dark:)text-ev-teal-light/]',
          message:
            'text-ev-teal-light is 2.49:1 on white and fails AA in light mode. Use text-link (teal in light, ev-teal-light in dark), or scope it with dark:text-ev-teal-light.',
        },
        {
          selector: 'TemplateElement[value.raw=/(?<!dark:)text-ev-teal-light/]',
          message:
            'text-ev-teal-light is 2.49:1 on white and fails AA in light mode. Use text-link (teal in light, ev-teal-light in dark), or scope it with dark:text-ev-teal-light.',
        },
      ],
    },
  },
])
