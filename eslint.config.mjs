import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node, ...globals.jest },  // Adding Jest globals
    },
  },
  pluginJs.configs.recommended,
  {
    plugins: { jest: pluginJest },  // Adding Jest plugin
    rules: {
      ...pluginJest.configs.recommended.rules,  // Using recommended Jest rules
    },
  },
];
