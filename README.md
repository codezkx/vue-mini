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
## Vue响应式核心

### reactive



### ref

- 思想

  > 利用class中的get/set 属性来对ref中的基础类型值进行监听, 如果是对象则利用reactive来进行proxy代理对应对象

- 过程

  1. 如果ref是一个基础类型, 则直接利用class的getter/setter方法监听对应的值变化
  2. 如果ref是一个对象, 则在实例化RefImpl类是进行proxy代理

#### isRef

- 思想

  > 利用RefImpl设置的属性__v_isRef来判断是否为ref

#### unref

- 思想

  > 利用你isRef判断是否为ref如果是返回ref.value不是返回原值, 值的注意的是如果ref是一个对象那么使用unref后只是把它改变成不是ref的对象, 但是这个对象还是reactive对象。在初始化时进行操作的.



## 双端对比

### 1、左则对比（确定i的值）

>设置老节点和新节点的最后元素的标识e1/e2 (children长度), 在利用一个变量i来判断元素的那个位置开始出现不同(while循环 从左侧开始判断(注意左侧第一个元素是相同的)).

- 判断两个子节点是否相等
  - 利用type和key(唯一的)
  - 递归判断节点的children(同一级)
- 出现不同节点时需要停止设置i

````	
// (a b) c
// (a b) d e
````



### 2、右侧对比（确定e1/e2的值）

> 设置老节点和新节点的最后元素的标识e1/e2, 在利用一个变量i来判断元素的那个位置开始出现不同(while循环 当左侧第一个元素不想通时, 对比右侧(上面左侧对比可知是否相同)
>

- 判断两个子节点是否相等
  - 利用type和key(唯一的)
  - 递归判断节点的children(同一级)
- 出现不同节点时需要停止设置e1/e2 (递减)

````
// a (b c)
// d e (b c)
````

### 3、新的比老的长

>根据上面两个步骤得出的索引值添加新元素(注意这时还是vnode需要利用patch方法)

#### 左侧

> 根据上面的两判断已经可以确定元素出现不同的位置i, i > e1 && i < e2
>
> 只要把满足i > e1 && i < e2范围的元素渲染出来就行
>
> ​	设置一个“锚点”获取设置元素的位置(兼容右侧)

````
// (a b)
// (a b) c
````

#### 右侧

> 根据上面的两判断已经可以确定元素出现不同的位置i, i > e1 && i < e2
>
> 只要把满足i > e1 && i < e2范围的元素渲染出来就行 (需要注意的是元素渲染的位置还是在前面) 
>
> ​	设置一个“锚点”获取设置元素的位置

````
// (a b)
// c (a b)
````

### 4、老的比新的长

> 根据上面两个步骤得出的索引值删除对应的元素
>
> 根据“i”确定需要删除元素的范围

## 解析三种联合类型

## Monorepo

### Monorepo 是什么

- 单一仓库

  > 组织代码的一种方式

- 把所有相关的项目都放到一个仓库中

  > 一般情况下放到packages目录中(可以放在其他目录中)

#### 优点

- 公共基础设施,不用重复配置.
- 优以来的项目之间调试开发非常方便
- 第三方库的版本管理更简单

#### 缺点

- 项目颗粒度的权限管理问题
- 代码量比较庞大对于新手不友好

### 主流的monorepo工具

- npm
- yarn
- pnpm
- larna
- turborepo
- nx
- RushJS

### how

#### 使用pnpm的monorepo

- workspace

  - 命令

    - pnpm l xxx -W

      > 安装到root目录下

    - pnpm l xxx -F xxx

      > 安装到指定目录下

  - 配置文件: pnpm-workspace.yaml

#### 包的依赖顺序

- reactivity

  - shared

  > root: pnpm i @mini-vue/shared --filter reactivity (利用pnpm安装其他模块, 文件修改是同步的)

- runtime-core

  - reactivity
  - shared

  > root: pnpm i @mini-vue/shared  @mini-vue/reactivity --filter runtime-core

- runtime-dom

  - runtime-core

  > root: pnpm i @mini-vue/runtime-core --filter runtime-dom

- compiler-core

  - shared

  > root: pnpm i @mini-vue/shared --filter compiler-core

- Vue

  - compiler-core
  - runtime-dom

  > root:  pnpm i @mini-vue/runtime-dom @mini-vue/compiler-core --F vue



















