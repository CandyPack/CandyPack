import js from '@eslint/js'
import globals from 'globals'
import {defineConfig} from 'eslint/config'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default defineConfig([
  {
    files: ['core/**/*.js', 'watchdog/**/*.js', 'server/**/*.js', 'cli/**/*.js'],
    ignores: ['server/src/Candy.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        Candy: 'readonly',
        __: 'readonly'
      },
      sourceType: 'script'
    },
    plugins: {
      js,
      prettier: prettierPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['server/src/Candy.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        log: 'readonly',
        __: 'readonly'
      },
      sourceType: 'script'
    },
    plugins: {
      js,
      prettier: prettierPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['framework/**/*.js'],
    ignores: ['framework/web/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        Candy: 'readonly',
        __dir: 'readonly'
      },
      sourceType: 'script'
    },
    plugins: {
      js,
      prettier: prettierPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['framework/web/**/*.js'],
    languageOptions: {
      globals: {...globals.browser},
      sourceType: 'module'
    },
    plugins: {js},
    rules: {
      ...js.configs.recommended.rules
    }
  },
  {
    files: ['web/**/*.js'],
    ignores: ['web/public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        Candy: 'readonly'
      },
      sourceType: 'script'
    },
    plugins: {
      js,
      prettier: prettierPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['web/public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        Candy: 'readonly'
      },
      sourceType: 'script'
    },
    plugins: {
      js,
      prettier: prettierPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  }
])
