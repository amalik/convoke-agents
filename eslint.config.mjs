import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-constant-condition": ["error", { "checkLoops": false }]
    }
  },
  {
    files: ["scripts/**/*.js"],
    rules: {
      "no-restricted-syntax": ["error",
        {
          "selector": "CallExpression[callee.object.name='process'][callee.property.name='cwd']",
          "message": "Avoid process.cwd(). Use findProjectRoot() from lib/utils.js instead. Only utils.js and installer main() fallbacks may use process.cwd()."
        }
      ]
    }
  },
  {
    files: [
      "scripts/update/lib/utils.js",
      "scripts/install-vortex-agents.js",
      "scripts/install-all-agents.js",
      "scripts/install-emma.js",
      "scripts/install-wade.js"
    ],
    rules: {
      "no-restricted-syntax": "off"
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    }
  },
  {
    // tests/**/golden/ — byte-exact test fixtures captured from generators.
    // Excluded from lint because they must mirror generator output exactly,
    // including any unused variables. Reformatting them to satisfy lint
    // breaks the regression contract. See tests/team-factory/golden/README.md.
    ignores: ["node_modules/", "_bmad/", "_bmad-output/", "_quint/", "coverage/", "tests/**/golden/"]
  }
];
