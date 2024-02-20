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

