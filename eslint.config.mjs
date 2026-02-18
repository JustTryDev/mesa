import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    "docs/**",
    "supabase/**",
  ]),
  // 에디터/뷰어 컴포넌트에서 img 태그 허용 (동적 이미지 처리)
  {
    files: [
      "src/components/ui/RichTextEditor.tsx",
      "src/components/ui/RichTextViewer.tsx",
      "src/components/ui/editor/**/*.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  // React 19 Compiler 신규 규칙 — 점진적 대응을 위해 warn 처리
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
