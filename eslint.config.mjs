import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * The project had a `lint` script but no ESLint configuration, so it had never
 * actually run. This is the Next.js recommended set plus its Core Web Vitals
 * rules — the ones that catch real regressions (unoptimised images, sync
 * scripts, missing keys) rather than style opinions.
 */
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Server actions legitimately take `formData: FormData` and return
      // untyped Supabase rows; `any` in those seams is noise, not a defect.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
