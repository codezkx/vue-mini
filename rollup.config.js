import sourceMaps from "rollup-plugin-sourcemaps";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

// import replace from "@rollup/plugin-replace";

export default {
  input: "./packages/vue/src/index.ts",
  output: [
    {
      format: "cjs",
      file: "./packages/vue/dist/mini-vue.cjs.js",
    },
    {
      format: "es",
      file: "./packages/vue/dist/mini-vue.esm-bundler.js",
    },
  ],
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
    sourceMaps(),
  ],
};
