// Use an empty export statement to mark this file as module augmentation.
// Without this, the file is recognized as ambient module declaration and
// our type definitions replace the original React types instead of extending them.
// ref:
//   - https://github.com/microsoft/TypeScript/issues/49227
//   - https://zenn.dev/qnighy/articles/9c4ce0f1b68350
//   - https://www.typescriptlang.org/docs/handbook/declaration-merging.html
export {};

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
