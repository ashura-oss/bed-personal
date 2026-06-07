import eslint from "@eslint/js";

export default [
  eslint.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        AudioBuffer: "readonly",
        AudioBufferSourceNode: "readonly",
        AudioContext: "readonly",
        Blob: "readonly",
        CustomEvent: "readonly",
        Document: "readonly",
        Event: "readonly",
        GainNode: "readonly",
        getComputedStyle: "readonly",
        HTMLElement: "readonly",
        KeyboardEvent: "readonly",
        MouseEvent: "readonly",
        OscillatorNode: "readonly",
        ParentNode: "readonly",
        PointerEvent: "readonly",
        Response: "readonly",
        URL: "readonly",
        WheelEvent: "readonly",
        Window: "readonly",
        cancelAnimationFrame: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        module: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        window: "readonly"
      }
    },
    rules: {
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
];
