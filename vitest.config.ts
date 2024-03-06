import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
    },
    resolve: {
        alias: [
            {
                find: /@mini-vue\/([\w-]*)/, // 匹配类似 @mini-vue/runtime-core/src 
                replacement: path.resolve(__dirname, "packages") + "/$1/src",
                
            }
        ]
    }
});
