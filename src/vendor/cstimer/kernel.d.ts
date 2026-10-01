// Minimal typings for kernel.js, the stand-in for csTimer's settings.

declare const kernel: {
  /** csTimer's settings by name, e.g. `colcube` (the cube colors, "#ff0#fa0..."). */
  props: Record<string, string | number | boolean>;
};
export default kernel;
