import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["server/watchdog.js"],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "script",
    }, 
    extends: ["js/recommended"],
    plugins: { js },
  },
  {
    files: ["server/**/*.js"],
    ignores: ["server/watchdog.js", "server/web/**"], 
    languageOptions: {
      globals: {
        ...globals.node,
        Candy: "readonly",
        log: "readonly",
        "__": "readonly"
      },
      sourceType: "script",
    },
    extends: ["js/recommended"],
    plugins: { js },
  },
  {
    files: ["framework/**/*.js"],
    ignores: ["framework/web/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        Candy: "readonly",
        "__dir": "readonly"
      },
      sourceType: "script",
    },
    extends: ["js/recommended"],
    plugins: { js },
  },
  {
    files: ["framework/web/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser },
      sourceType: "module",
    },
    extends: ["js/recommended"],
    plugins: { js },
  },
  {
    files: ["server/web/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        Candy: "readonly",
      },
      sourceType: "script",
    },
    extends: ["js/recommended"],
    plugins: { js },
  }
]);