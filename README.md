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

### computed

- 思想

  > 传入一个函数getter,  然后实例化ReactiveEffect并传入第二个参数使用来初始化dirty属性(判断是否需要更新值), 当读取计算属性时会触发effect.run()方法也就是执行getter. 这个期间会对响应式属性进行响应式依赖收集, 并获取返回值.
  

### watchEffect

- 思想

> 创建一个 ReactiveEffect(getter, scheduler) 然后执行run方法收集依赖,返回 stop方法. 当更新响应式数据时触发依赖调用scheduler回调函数, 然后执行任务队列, 也就是run()方法.  为什么要用任务队列异步处理? 因为更新可能是批量的, 可以优化更新批量统一处理更新逻辑, 可以优化性能，避免在同一个事件循环中多次更新DOM，从而减少重绘和重排的次数。

### Watch

#### 侦听数据源类型

> 1、监听响应式对象
>
> 2、监听函数(普通值需要使用函数进行监听)
>
> 3、监听多个响应式值, 数组形式.

### Emit

>- 创建组件实例时把组件实例 instance(注意这个实例是子组件)通过bind绑定给emit
>
>- 当调用emit执行
>  - 先处理event事件名将其改成驼峰名 如 foo -> onFoo | add-foo -> onAddFoo
>  - 在props中回去当前事件属性
>    -  props[handlerName]
>  - 然后执行
>
>

### Solt

> 1、父组件把插槽处理成对象形式
>
> ````ts
>  {
>  				default: () => h("p", {}, "123"),
>         header: ({ age }) => [
>           h("p", {}, "header" + age),
>           createTextVNode("纯文本节点"),
>         ],
>         footer: () => h("p", {}, "footer"),
>  }
> ````
>
> 2、初始化组件(setupComponent)中初始化 插槽, 在函数initSolts中初始化, 把父组件中插槽对象绑定到组件实例的$slots上(组件传入参数(实现作用域插槽关键))
>
> 3、子组件中使用renderSolts来渲染插槽
>
> ````ts
> // 把slots转换成虚拟节点(主要处理slots为数组)  props 就是实现作用域插槽, 父组件可以获取到子组件插槽的参数
> export function renderSlots(slots, name = "default", props = {}) {
>   const slot = slots[name]; // 获取默认/具名插槽
>   if (slot) {
>     if (isFunction(slot)) {
>       return createVNode(Fragment, {}, slot(props));
>     }
>   }
> }
> ````
>
> 

### Provide-inject

> - Provide
>
>   - 利用 getCurrentInstance 获取当前的组件的实例, 又因为实例上的provide是在创建时取自 父组件 中的实例的provide
>
>   - 如何跨组件传递参数呢
>
>     > 利用原型链来解决 provides = currentInstance.provides = Object.create(parentProvides);
>
> - inject
>
>   - 利用 getCurrentInstance 获取当前的组件的实例, 
>   - 利用原型链查找对应的值
>
> 
>
> 

### Runtime-core

> 1. 根据提供的根元素#app创建vnode对象
> 1. 执行render函数 -> 调用patch函数
> 3. 判断元素类型
>    1. 如果是文本类型直接element.append(text)
>    2. 如果是组件

#### 组件类型

> 1. 调用processComponent
>    1. 判断是否初始化利用n1(初始化时没有)
>       1. 如果没有初始化则调用mountComponent函数: 作用创建组件实例对象
>          1. 调用setupComponent:  初始组件属性及其render
>             1. 初始化Props/slots
>             2. setupStatefulComponent
>                1. 对组件实例进行代理
>                2. 组件是否有setup函数
>                   1. 如果有在调用setup期间, 写入组件实例. 然后处理setup返回值setupResult
>                      1. 函数: 直接赋值给render函数
>                      2. 对象: 需要对setupResult进行代理, 这里做了解构处理,也就是在模版上访问ref响应式对象时不需要.value
>                      3. 如果都没有则把模版template传给render函数
>          2. setupRenderEffect: 
>             1. 添加组件实例方法update, update作用: 把实例对象绑定到render函数上, 递归调用patch方法.
>             2. 处理render函数, 利用effect(创建一个ReactiveEffect实例)函数执行render函数
>             3. 执行run()方法, instance.render.call(proxy, proxy)对render函数绑定代理对象, 使其能访问到组件实例对象.
> 2. 









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
>
> ​    *// (a b)   e1 = 1  ℹ = 2        (a b) 1 0   e1 = 1  ℹ = 2*   
>
> ​    *// (a b) c d  e2 = 3           d c (a b) 12  e1 = 3  ℹ = 2*   
>
> *// 如果使用 nextPos = i + 1 那么c2[i]会一直获取到c， anchor一直是null 渲染出来的结果就是 a b c d*
>
> ​        *// 如果是这种情况的话就说明 e2 也就是新节点的数量大于旧节点的数量*
>
> ​        *// 也就是说新增了 vnode*
>
> ​        *// 应该循环 c2*
>
> ​        *// 锚点的计算：新的节点有可能需要添加到尾部，也可能添加到头部，所以需要指定添加的问题*
>
> ​        *// 要添加的位置是当前的位置(e2 开始)+1*
>
> ​        *// 因为对于往左侧添加的话，应该获取到 c2 的第一个元素*
>
> ​        *// 所以我们需要从 e2 + 1 取到锚点的位置*

### 5、中间对比

> *// 删除老的  (在老的里面存在，新的里面不存在)*
>
> *// 5.1*
>
> *// a,b,(c,d),f,g*
>
> *// a,b,(e,c),f,g*
>
> *// i = 2, e1 = 3, e2 = 3*
>
> *// D 节点在新的里面是没有的 - 需要删除掉*
>
> *// C 节点 props 也发生了变化*



> *// a,b,(c,e,d),f,g*
>
> *// a,b,(e,c),f,g*
>
> *// 中间部分，老的比新的多， 那么多出来的直接就可以被干掉(优化删除逻辑)*



> *移动 (节点存在于新的和老的里面，但是位置变了)*
>
> *// 2.1*
>
> *// a,b,(c,d,e),f,g*
>
> *// a,b,(e,c,d),f,g*
>
> *// 最长子序列： [1,2]*



> *创建新的节点*
>
> *// a,b,(c,e),f,g*
>
> *// a,b,(e,c,d),f,g*
>
> *// d 节点在老的节点中不存在，新的里面存在，所以需要创建*



## compiler-core

#### Parse

> 将字符串模版转换成AST树(抽象语法树)

#### transform

> **节点遍历和转换**:
>
> - 在 `transform` 阶段，编译器会遍历 AST 树中的每个节点，根据节点的类型（例如元素节点、文本节点、指令节点等）应用不同的转换规则。
> - 通过不同的插件（如 `transformElement`、`transformText` 等），编译器可以对每个节点进行相应的处理，比如解析指令、绑定属性、处理事件等。
>
> **生成代码片段**:
>
> - 编译器会将每个节点转换成 JavaScript 代码片段。这些代码片段最终会组合成完整的渲染函数（render function）。
> - 例如，对于一个模板表达式 `{{ message }}`，它会被转换成一个 `_ctx.message` 的代码片段，这个代码片段将在渲染函数中被执行。

### generate

> 生成code 字符串render函数模版

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



















