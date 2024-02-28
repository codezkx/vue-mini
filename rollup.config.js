import typescript from "@rollup/plugin-typescript";
import sourceMaps from "rollup-plugin-sourcemaps";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
// import replace from "@rollup/plugin-replace";

import pkg from "./package.json" assert { type: "json" };
export default {
  input: "./src/index.ts",
  output: [
    {
      format: "cjs",
      file: pkg.main,
    },
    {
      format: "es",
      file: pkg.module,
    },
  ],
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
    sourceMaps(),
  ],
};
