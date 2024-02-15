# vue-mini
## 集成jest（单元测试）和ts

### 安装

> pnpm add typescript -D
>
> - 执行npx tsc --init 
>   - 创建tsconfig.json 文件
>
> pnpm add jest @types/jest -D
>
> - 修改package.json的脚本命令
>
> `````json
>   "scripts": {
>     "test": "jest" // 执行单元测试
>   },
> `````
>
> 

[配置babel](https://jestjs.io/zh-Hans/docs/getting-started#%E4%BD%BF%E7%94%A8-babel)

> pnpm add --save-dev babel-jest @babel/core @babel/preset-env
>
> pnpm add --save-dev @babel/preset-typescript

````js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};
````

