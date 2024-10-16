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

- 思想

  > 1、利用proxy创建一个代理对象
  >
  > 2、在读取代理对象属性时, 如果target对象不是一个只读对象, 则需要收集依赖 track
  >
  > 3、在改变代理对象数据时, 会出发proxy里面的set方法. 这时触发依赖, 然后更新对应的值

### ref

- 思想

  > 1、判断传入的value是不是一个ref, 如何是直接返回. 否则实现RefImpl接口
  >
  > 2、将传入的value进行去除响应式利用toRaw得到最初的值
  >
  > 3、如何value是一个对象则直接利用reactive生成响应式对象
  >
  > 4、利用class中的get/set 属性来对ref中的基础类型值进行监听, 如果是对象则利用reactive来进行proxy代理对应对象
  >
  > 

- 过程

  1. 如果ref是一个基础类型, 则直接利用class的getter/setter方法监听对应的值变化
  2. 如果ref是一个对象, 则在实例化RefImpl类是进行proxy代理

#### isRef

- 思想

  > 利用RefImpl设置的属性__v_isRef来判断是否为ref

#### unref

- 思想

  > 利用你isRef判断是否为ref如果是返回ref.value不是返回原值, 值的注意的是如果ref是一个对象那么使用unref后只是把它改变成不是ref的对象, 但是这个对象还是reactive对象。在初始化时进行操作的.

#### toRef

- 思想

  > 可以将值、refs 或 getters 规范化为 refs 

#### toValue

- 思想

  > 将值、refs 或 getters 规范化为值。这与 [unref()](https://cn.vuejs.org/api/reactivity-utilities.html#unref) 类似，不同的是此函数也会规范化 getter 函数。如果参数是一个 getter，它将会被调用并且返回它的返回值。

#### toRefs

- 思想

  > 将一个响应式对象转换为一个普通对象，这个普通对象的每个属性都是指向源对象相应属性的 ref。每个单独的 ref 都是使用 [`toRef()`](https://cn.vuejs.org/api/reactivity-utilities.html#toref) 创建的。

### computed

- 思想

  > - 传入一个函数getter,  然后实例化ReactiveEffect并传入, 第二个参数使用来初始化dirty属性(判断是否需要更新值).
  > - 当读取计算属性时会触发effect.run()方法也就是执行getter. 返回对应的值
  > - 计算属性的缓存思想: 利用dirty属性进行控制的, 当多次调用计算属性时 dirty 作为 “开关”把数据没有更新的情况下的操作, 统统返回旧数据
  > - 当被计算属性 “监听”的响应式属性 变化时会出发 响应式系统的 调度员方法 *scheduler*. 重制dirty属性的值
  

### watchEffect

- 思想

> 创建一个 ReactiveEffect(getter, scheduler) 然后执行run方法收集依赖,返回 stop方法. 当更新响应式数据时触发依赖调用scheduler回调函数, 然后执行任务队列, 也就是run()方法.  为什么要用任务队列异步处理? 因为更新可能是批量的, 可以优化更新批量统一处理更新逻辑, 可以优化性能，避免在同一个事件循环中多次更新DOM，从而减少重绘和重排的次数。

### 异步更行机制

- 思想

  > 当一次更新需要出发多个响应式数据时, vue响应式系统会把对应的 **run/scheduler** 方法添加到任务队列中, 初始调用queueJob会**异步执行**对应的 **run/scheduler**, 再次进来时被“开光”属性isFlushPending控制, 不在次执行**run/scheduler**方法, 而是添加到 任务队列中, 当同步更新执行完成时. 执行才执行**run/scheduler**, 这时候不管前面更新多次响应式数据,  **run/scheduler** 只执行一次

### Watch

#### 侦听数据源类型

> 1. 注意的是watch和watchEffect, 流程差不多的, 主要区别与第二个参数
> 2. 将所有的响应式类型(必须是值)转化成**getter**函数
> 3. 注意的是traverse函数是为了触发响应式数据的 track 依赖收集动作
> 4. 创一个 ReactiveEffect实例
>    1. 如何时watchEffect则直接执行 run 方法
>    2. 而watch是需要返回 newV 和 odlValue的需要更多的处理
> 5. 返回一个 清除监听的函数 (就是删除实例)
> 

一个返回响应式对象的 getter 函数，只有在返回不同的对象时，才会触发回调

````vue
<script setup>
  const o = reactive({a: 1, b: {c: 1}})
	watch(
    () => o.b,
    () => {
      // 仅当 o.b 被替换时触发
    }
  )
</script>
````

> 1. 上面为什么只有改变o.b时才会触发, 是因为执行watch过程中是没有执行 traverse 函数来收集依赖的, 所以只有执行effect.run 才依赖收集.
> 2. 响应式依赖更新时会触发 effect.scheduler方法, 来触发回调函数

### Emit事件

>- 创建组件实例时把组件实例 instance(注意这个实例是子组件)通过bind绑定给emit
>- 当调用emit执行时, 相当于执行父组件中传入下来的回调函数
> - 先处理event事件名将其改成驼峰名 如 foo -> onFoo | add-foo -> onAddFoo
> - 在props中回去当前事件属性
>   -  props[handlerName]
> - 然后执行
>
>

### Solt

> 1、父组件把插槽处理成对象形式
>
> ````ts
>  {
>  		default: () => h("p", {}, "123"),
>        header: ({ age }) => [
>           h("p", {}, "header" + age),
>           createTextVNode("纯文本节点"),
>         ],
>        footer: () => h("p", {}, "footer"),
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
>     if (slot) {
>         if (isFunction(slot)) {
>           return createVNode(Fragment, {}, slot(props));
>         }
>     }
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

### 思考

> 1. 索引值确认阶段
>
>    1. 左侧对比是确定i的值
>    2. 右侧对边是确定e1、e2的值
>
> 2. 只增加节点或者只减少节点
>
>    1. **新**节点比**老**节点**多**, 则直接创建新节点
>    2. **新**节点比**老**节点**少**, 则直接删除节点
>
>    注意: 除了新增或者减少的节点其他节点类型和顺序必须相同
>
> 

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



## interview

### Vue2 和 Vue3的区别

#### Composition API

> 1、vue3新增了组合式API(composition API), 而且保留了vue2中的配置项模式, vue3的CompositionAPI也向前兼容vu2.7, 也就是说vue2也可以使用Composition API
>
> 2、因为配置项模式编写vue代码, 是难以维护的. 因为业务逻辑逻辑可能存在data、conputed、method、watch中. 而composition API可以有开发者自己组织代码的逻辑及其编写位置. Coposition API主要的API有setup()/ref/reactive/computed/readonly//watch/EffectWatch(自动收集依赖)

#### 响应式系统

> Vue2 使用的Object.definedProperty()来实现对应的属性监听, 这种方法的缺点是无法直接监听对象的新增属性和删除属性
>
> Vue3 使用的是Proxy 来监听对象, 不会出现Object.definedProperty()无法直接监听新增属性和删除属性, 使用Proxy还带来了性能的提升. 我们知道defineProperty()是对属性的监听, 需要遍历对象, 如果对象层次很深那么需要递归监听没有属性, 带来的性能消耗是很大的.

#### 性能改进

> 1. vue3支持了tree-shaking功能, 也意味着项目中没有使用过的代码不会进行打包, 所以vue3打包后的代码会比vue2小很多
>
>    解释: Vue 2 的核心库并不完全支持 Tree-shaking，因为某些功能（如指令、过滤器等）在全局范围内可用，即使不使用这些功能，它们仍会被包含在最终打包中。
>
> 2. Proxy代替Object.defineProperty
>
>    1. Object.defineProperty无法直观的监听对象的新增属性和删除属性, 需要而外的处理
>    2. Proxy直接对对象进行监听不需要而外处理
>
> 3. 编译器优化
>
>    > 主要体现在静态节点提升和预编译
>
>    1. 静态节点: 将每次更新都不会变化的节点,设置为静态节点. 每次重新渲染时不需要重新创建和也无需对比其节点, 这也是vue3中的diff算法的优化
>    2. 预字符串化: 在预编译时将一些静态内容直接换成字符串, 使得渲染时不需要再做而外的计算, 减少了运行时消耗
>
> 4. Fragment
>
>    1. 支持多个根节点, 避免多余的元素嵌套
>
> 5. 在 Vue 3 中，虚拟 DOM 的 Diff 算法有以下主要优化：
>
>    1. **节点类型的分类比较**：
>       - Vue 3 对节点进行了分类，优化了不同类型节点的比较逻辑。例如，当节点的类型不同（如从元素节点变为文本节点）时，可以直接进行替换，而不是深入比较其子节点。
>    2. **静态节点的识别**：
>       - 在编译阶段，Vue 3 会识别并标记静态节点（未变化的节点），这些节点在后续更新时会被跳过，从而减少了不必要的比较和渲染。
>    3. **优化组件更新**：
>       - Vue 3 针对组件的更新进行了优化，比如通过对比组件的 key 值来快速定位需要更新的组件，减少了整体更新的复杂性。
>    4. **优化了数组的 Diff**：
>       - Vue 3 对数组的更新和比较进行了优化，特别是支持 `key` 的情况下，可以更快地进行定位和更新。

#### Teleport

> 1. 把对应的DOM节点渲染到指定的位置进行渲染.

### Fragment

> 1. 支持多节点渲染

### Suspense

> 当加载异步组件时, 用于处理异步组件加载过程的过度效果

### TypeScript支持

> **Vue 2**: 虽然可以使用 TypeScript，但支持并不完美，开发体验稍有欠缺。
>
> **Vue 3**: 对 **TypeScript** 提供了更好的支持，Vue 3 是用 TypeScript 编写的，并且提供了更完善的类型推导。

### 支持多v-model

> **Vue 2**: 单向绑定（父组件到子组件）中，`v-model` 只能绑定一个 `prop` 和 `event`。
>
> **Vue 3**: `v-model` 支持绑定多个 `v-model`，你可以为不同的属性指定不同的绑定。

## 什么是虚拟DOM?

> 虚拟DOM定义: 
>
> 1. 对真实DOM结构的抽象的JS轻量级对象
> 2. 提高性能
> 3. 简化DOM操作

### 基础概念

> 1. 树形结构: 虚拟DOM的结构是一个树形结构, 每个节点对应一个真实DOM元素, 树的每一个节点包含其类型、属性、子节点等信息.
> 2. 由于虚拟DOM是一个轻量级JS对象, 不包含真实DOM得所有复杂性, 使其创建和更新成本远低于操作真实DOM

### 工作原理

> 就是DOM初始化流程, 自行查看源码

### 优势

> 1. 提高性能: 通过虚拟DOM, vue可以进行批量的更新DOM, 减少大量的重排重绘, 提升了渲染性能
> 2. 跨平台: 虚拟DOM抽象了真实DOM得操作, 使得vu e可以在不同的平台进行渲染执行.
> 3. 简化开发: 开发者只需要关注业务的开发, 不需要关注DOM得更新和优化. Vue会自动处理DOM的更新和优化, 降低了手动操作DOM的复杂性

## 虚拟DOM作用

### 提高性能

> 1. 高效更新: 虚拟DOM是一个轻量级的JS对象, 它表示真实DOM得结构. 当响应式数据发生变化时, Vue会先在虚拟 DOM中进行变化, 而不是直接操作真实的DOM. 这样做是为了避免频繁的操作真实的DOM元素
> 2. 差异计算: 通过对比新老虚拟DOM(diff算法), Vue能够高效地计算出哪些需要更新的部分, 然后指针对这部分进行更新, 而不是全量更新, 大大减少了DOM操作的开销

### 跨平台支持

> 1. 平台无关性: 虚拟DOM抽象了真实DOM操作, 使得Vue可以在不同的渲染平台上实现相同的功能, 这种抽象使得代码可以在多个平台间重用.

### 简化开发

> **声明式编程**：通过虚拟 DOM，Vue 允许开发者以声明式的方式描述 UI。当状态变化时，开发者不需要手动更新 DOM，只需更新状态，Vue 会自动根据新状态重新渲染虚拟 DOM，并更新真实 DOM。这使得开发更加直观和易于管理。
>
> **组件化**：虚拟 DOM 的存在使得 Vue 的组件化设计更加高效。每个组件的渲染逻辑都可以独立地使用虚拟 DOM 进行管理，从而提高了组件的复用性和维护性

### 增强的可调试性

> 调试工具支持: 由于虚拟DOM使得UI状态与渲染逻辑分离, 调试工具(devTools)能够容易地分析组件树和状态变化, 帮助开发者更有效地进行调试

### 简化性能优化

> **高效更新策略**：虚拟 DOM 使得开发者无需关注复杂的性能优化策略，Vue 会根据 diff 算法智能地更新 DOM。在大多数情况下，开发者只需关注业务逻辑，而不必担心性能问题。











