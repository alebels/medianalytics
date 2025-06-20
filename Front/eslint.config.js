// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/sort-lifecycle-methods": [
        "error"
      ],
      // Sort imports rule
      "sort-imports": [
        "error",
        {
          ignoreCase: false,
          ignoreDeclarationSort: false,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
          allowSeparatedGroups: true,
        },
      ],
      // Member ordering rules
      "@typescript-eslint/member-ordering": [
        "error",
        {
          default: {
            memberTypes: [
              // Index signature
              "signature",

              // Constructors
              "public-constructor",
              "protected-constructor",
              "private-constructor",

              // Methods
              "public-static-method",
              "protected-static-method",
              "private-static-method",

              "public-decorated-method",
              "protected-decorated-method",
              "private-decorated-method",

              "public-instance-method",
              "protected-instance-method",
              "private-instance-method",

              "public-abstract-method",
              "protected-abstract-method"
            ]
          },
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
