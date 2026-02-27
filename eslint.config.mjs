import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...convexPlugin.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/app/api/**"],
    rules: {
      // Unused variables: error, ignore _-prefixed names
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // No `any` type allowed
      "@typescript-eslint/no-explicit-any": "error",
      // Non-null assertion (!) operator — warn since existing code uses it
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Enforce `import type` for type-only imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Allow console.warn and console.error (e.g. in catch blocks), warn on others
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Always use const when possible
      "prefer-const": "error",
      // No var declarations
      "no-var": "error",
      // React hooks deps must be complete
      "react-hooks/exhaustive-deps": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "convex/_generated/**",
  ]),
]);

export default eslintConfig;
