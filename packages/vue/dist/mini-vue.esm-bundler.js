const extend = Object.assign;
const EMPTY_OBJ = {};
function hasChanged(value, odlValue) {
  return !Object.is(value, odlValue);
}
const isOn = (val) => /^on[A-Z]/.test(val);
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray = Array.isArray;
const objectToString = Object.prototype.toString;
const toTypeString = (val) => objectToString.call(val);
const isFunction = (val) => toTypeString(val) === "[object Function]";
const isString = (val) => typeof val === "string";
const isObject = (val) => val !== null && typeof val === "object";

// 处理 add-foo => addFoo 情况
const camelize = (str) => {
  return str
    ? str.replace(/-(\w)/g, ($0, $1) => {
        return $1.toUpperCase();
      })
    : "";
};
// add -> Add
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
const toHandlerKey = (str) => (str ? "on" + capitalize(str) : "");

const toDisplayString = (val) => {
  return String(val);
};

let activeEffect; // 获取当前effect实例对象
let shouldTrack; // 是否需要追踪
// 使用class存储当前的FN(依赖更新函数)
class ReactiveEffect {
  constructor(fn, scheduler) {
    this.deps = [];
    this.active = true;
    this._fn = fn;
    this.scheduler = scheduler;
  }
  // 主要目的是更新依赖和收集依赖
  run() {
    // 当stop后不需要执行后续操作
    if (!this.active) {
      return this === null || this === void 0 ? void 0 : this._fn();
    }
    shouldTrack = true;
    activeEffect = this;
    const result = this === null || this === void 0 ? void 0 : this._fn();
    shouldTrack = false;
    return result;
  }
  // 这里注意调用stop的实例， 相当于删除对应的this
  stop() {
    // 处理多次执行stop的情况
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
// 清除当前实例所有的依赖
function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  // 初始化数据
  effect.deps.length = 0;
}
// 收集依赖
const targetMap = new Map();
function track(target, key) {
  // 判断是否需要收集依赖
  if (!isTracking()) return false;
  // target(Map) -> key(Map) -> dep( Set 唯一)
  // 1、取出target的Map
  let depsMap = targetMap.get(target); // 取出key
  // 2、判断是否为空
  if (!depsMap) {
    // 2.1、为空则初始化Map
    depsMap = new Map(); // 第一次执行时没有对应的key value 则初始化
    // 2.2、存储对应的Map
    targetMap.set(target, depsMap); // Map({} => Map())
  }
  // 3、利用key取出对应的Set  dep =>  Set(key){activeEffect}
  let dep = depsMap.get(key); // 取出 dep的 Set
  // 4、判断Set是否为空
  if (!dep) {
    // 4.1、如果为空初始化Set
    dep = new Set();
    // 4.2、存储对应的Set  Map(target => Map(key => Set))
    depsMap.set(key, dep);
  }
  trackEffects(dep);
}
function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  // 5、把当前的effect 添加到 dep中  Map(target => Map(key => Set(key){activeEffect}))
  dep.add(activeEffect); // 这里连接收集依赖和触发依赖的关系
  // 6、实现stop 的清空依赖功能
  activeEffect.deps.push(dep);
}
function isTracking() {
  // shouldTrack 是处理a++此等情况的（同时触发get 和 set）
  return activeEffect !== undefined && shouldTrack;
}
// 触发依赖
function trigger(target, key) {
  // 核心点是如何触发依赖更新 执行ReactiveEffect类中的run 方法  targetMap => Map(target => Map(key => Set(key){activeEffect}))
  const depsMap = targetMap.get(target); //  Map(target => Map(key => Set(key){activeEffect})
  const deps = depsMap.get(key); // Set(key){activeEffect}
  triggerEffects(deps);
}
function triggerEffects(deps) {
  // 便利ReactiveEffect
  for (let dep of deps) {
    if (dep.scheduler) {
      dep.scheduler();
    } else {
      dep.run();
    }
  }
}
// 每执行有一次effect就会创建一个fn的实例
function effect(fn, options = {}) {
  // 存储当前的fn
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  extend(_effect, options);
  // 将当前实力指向run方法
  const runner = _effect.run.bind(_effect);
  // JS中函数本质也是一个对象
  runner.effect = _effect;
  return runner;
}
function stop(runner) {
  // 删除 effect 对应的fn实例
  runner.effect.stop();
}

var ReactiveFlags;
(function (ReactiveFlags) {
  ReactiveFlags["SKIP"] = "__v_skip";
  ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
  ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
  ReactiveFlags["IS_SHALLOW"] = "__v_isShallow";
  ReactiveFlags["RAW"] = "__v_raw";
})(ReactiveFlags || (ReactiveFlags = {}));

/*
  优化点 当get执行时不需要每次调用createGetter或者createSetter，所以只需要模块引用时执行一次即可(利用缓存技术)
*/
const get = createGetter(false);
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandler = { get, set };
function createGetter(isReadonly = false, isShallow = false) {
  return function (target, key) {
    // 判断是否为 Reactive
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return isShallow;
    }
    // 收集依赖
    if (!isReadonly) {
      track(target, key);
    }
    // 获取目标对象的属性值
    const res = Reflect.get(target, key);
    if (isShallow) {
      return res;
    }
    // 处理对象嵌套问题
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    // 返回对应的数据
    return res;
  };
}
function createSetter() {
  return function (target, key, value) {
    // 1、设置对应的属性
    const res = Reflect.set(target, key, value);
    // 2、触发依赖更新
    trigger(target, key);
    // 3、返回是否设置成功
    return res;
  };
}
const readonlyHandlers = {
  get: readonlyGet,
  set: function (target, key, value) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`
    );
    return true;
  },
};
const shallowReadonlyHhandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});

function reactive(row) {
  return createActiveObject(row, mutableHandler);
}
function readonly(row) {
  return createActiveObject(row, readonlyHandlers);
}
function isReactive(row) {
  // 获取target中的属性（即使不存在）会触发get
  return !!(row === null || row === void 0
    ? void 0
    : row[ReactiveFlags.IS_REACTIVE]);
}
function isReadonly(row) {
  return !!(row === null || row === void 0
    ? void 0
    : row[ReactiveFlags.IS_READONLY]);
}
function shallowReadonly(row) {
  return createActiveObject(row, shallowReadonlyHhandlers);
}
function isProxy(row) {
  return isReactive(row) || isReadonly(row);
}
function createActiveObject(target, baseHandlers) {
  if (!target) {
    console.warn(`target ${target} 必须是一个对象`);
  }
  return new Proxy(target, baseHandlers);
}

/*
  1、proxy 只针对对象类型 基础类型不进行代理
  2、那ref需要进行对象包括（针对基础类型）
  3、利用对应的get set 方法触发依赖的收集与触发
   implement
*/
class RefImpl {
  constructor(value) {
    this.__v_isRef = true;
    // 存储最初的值
    this._rawValue = value;
    // 把嵌套对象（如果是对象的话）设置称响应式对应
    this._value = convert(value);
    this.dep = new Set();
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  // 更新对应依赖
  set value(value) {
    //当value与原来的value 相等时不需要更新_value
    if (hasChanged(value, this._rawValue)) {
      this._value = value;
      this._rawValue = value;
      triggerEffects(this.dep);
    }
  }
}
function trackRefValue(ref) {
  // 当初始化时activeEffect是为undefined 所以需要判断是否为空
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}
function ref(value) {
  return new RefImpl(value);
}
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
function isRef(value) {
  return !!value.__v_isRef;
}
function unRef(value) {
  return isRef(value) ? value.value : value;
}
// 实现在模板访问ref时不需要.value 此方法就是解构的方法
function proxyRefs(objectWithRefs) {
  /*
      为什么使用代理？
        因为需要在获取和设置时需要触发get 和 set  又因为objectWithRefs是对象
        所以使用proxy  （如果不是对象需要特别处理， 这里就不做处理了）
    */
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        /*
                  a.value= o // 此步骤省略   不是ref时也成立
                  a = o // 操作相当于下面
                */
        return Reflect.set(target, key, value);
      }
    },
  });
}

class ComputedRefImpl {
  constructor(getter) {
    this.dirty = true;
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this.dirty) {
        this.dirty = true;
      }
    });
  }
  get value() {
    if (this.dirty) {
      this._value = this._effect.run();
      this.dirty = false;
    }
    return this._value;
  }
}
function computed(getter) {
  return new ComputedRefImpl(getter);
}

const publicPropertiesMap = {
  // 当用户调用 instance.proxy.$emit 时就会触发这个函数
  // i 就是 instance 的缩写 也就是组件实例对象
  $el: (i) => i.vnode.el,
  $emit: (i) => i.emit,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 思想是在render中访问setup中的一个属性时可以取出
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      // 在render函数中访问到setup中返回的属性
      return setupState[key];
    } else if (hasOwn(props, key)) {
      // 在render函数中访问到setup中的props对象中的属性
      return props[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};

function emit(instance, event, ...args) {
  const { props } = instance;
  // 获取事件名规范模式 如 foo -> onFoo | add-foo -> onAddFoo
  const handlerName = toHandlerKey(camelize(event));
  // 获取事件的事件处理程序
  const handler = props[handlerName];
  handler && handler(...args);
}

/*
   思路: 获取父组件的当前组件传入下来的children, 然后渲染到自组件的对应位置
    1、获取当前组件的children
    2、判断children是否是slots
      1、首先判断是否为组件
      2、组件是否有children
    3、通过当前组件实例的slots,然后把children赋值给slots.
    4、如果slots是一个数组则需要转化成对应的vnode(利用renderSlots)
    5、把不是数组形式格式转化成数组格式
    
    6、命名插槽
      1、需要传入一个对象, 需要根据提供的key取出value
      2、判断是否为数组.

    7、作用域插槽
      1、需要把插槽转化成函数, 把对应的参数通过对象形式传入
      2、渲染插槽时如果传入的不是一个函数则不进行渲染
*/
function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & 32 /* ShapeFlags.SLOTS_CHILDREN */) {
    normalizeObjectSlots(children, instance.slots);
  }
}
// 处理具名插槽  实现key value形式.
function normalizeObjectSlots(children, slots) {
  console.log(children, slots, "slots");
  for (let key in children) {
    const value = children[key];
    if (isFunction(value)) {
      slots[key] = (props) => normalizeSlotValue(value(props));
    }
  }
}
function normalizeSlotValue(value) {
  return isArray(value) ? value : [value];
}

function initProps(instance, rawProps) {
  console.log("initProps");
  // TODO
  // 应该还有 attrs 的概念
  // attrs
  // 如果组件声明了 props 的话，那么才可以进入 props 属性内
  // 不然的话是需要存储在 attrs 内
  // 这里暂时直接赋值给 instance.props 即可
  instance.props = rawProps || {};
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
  const component = {
    type: vnode.type,
    vnode,
    next: null, // 最新的vnode
    props: {},
    parent,
    provides: parent ? parent.provides : {}, //  获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了
    proxy: null,
    isMounted: false,
    subTree: {},
    slots: {}, // 存放插槽的数据
    emit: () => {},
  };
  // 把组件实例传递给emit第一个参数， 这样用户就不需要传入组件实例了
  component.emit = emit.bind(null, component);
  return component;
}
// 初始对应的props、slot、setup
function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  // 源码里面有两种类型的 component
  // 一种是基于 options 创建的
  // 还有一种是 function 的
  // 这里处理的是 options 创建的
  // 叫做 stateful 类型
  setupStatefulComponent(instance);
}
// 获取setup返回值
function setupStatefulComponent(instance) {
  // todo
  // 1. 先创建代理 proxy
  console.log("创建 proxy");
  // proxy 对象其实是代理了 instance.ctx 对象
  // 我们在使用的时候需要使用 instance.proxy 对象
  // 因为 instance.ctx 在 prod 和 dev 坏境下是不同的
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    // 在setup之前赋值
    setCurrentInstance(instance);
    const setupContext = createSetupContext(instance);
    /**
     * @description 注意这里可能返回一个函数或者一个对象   真实的处理场景里面应该是只在 dev 环境才会把 props 设置为只读的
     * @returns {
     *    function: 是一个渲染函数（render）
     *    Object：需要把此对象注入到instance的上下文中不然rander函数不能通过this访问到setup中返回的数据
     * }
     */
    const setupResult = setup(shallowReadonly(instance.props), setupContext);
    setCurrentInstance(null);
    // 3. 处理 setupResult
    handleSetupResult(instance, setupResult);
  }
}
function createSetupContext(instance) {
  console.log("初始化 setup context");
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {}, // TODO 实现 expose 函数逻辑
  };
}
// 处理setup中返回的类型 function(就是渲染函数) | object（需要通过渲染函数）
function handleSetupResult(instance, setupResult) {
  // setup 返回值不一样的话，会有不同的处理
  // 1. 看看 setupResult 是个什么
  if (typeof setupResult === "function") {
    // 如果返回的是 function 的话，那么绑定到 render 上
    // 认为是 render 逻辑
    // setup(){ return ()=>(h("div")) }
    instance.render = setupResult;
  } else if (typeof setupResult === "object") {
    // 返回的是一个对象的话
    // 先存到 setupState 上
    // 先使用 @vue/reactivity 里面的 proxyRefs
    // 后面我们自己构建
    // proxyRefs 的作用就是把 setupResult 对象做一层代理
    // 方便用户直接访问 ref 类型的值
    // 比如 setupResult 里面有个 count 是个 ref 类型的对象，用户使用的时候就可以直接使用 count 了，而不需要在 count.value
    // 这里也就是官网里面说到的自动结构 Ref 类型
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}
// 确保实例对象上有render函数
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (!instance.render) {
    if (compiler && !Component.render) {
      if (Component.template) {
        Component.render = compiler(Component.template);
      }
    }
    instance.render = Component.render;
  }
}
function setCurrentInstance(instance) {
  currentInstance = instance;
}
// 获取当前组件实例(注意: 只能在setup函数中调用)
function getCurrentInstance() {
  return currentInstance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
  console.log(_compiler, "_compiler");
  compiler = _compiler;
}

// 用 symbol 作为唯一标识
const Text = Symbol("Text"); // 纯文本节点
const Fragment = Symbol("Fragment"); // 只渲染children
/**
 * @param type Object | string: 节点对象或者文本
 * @param props 节点属性
 * @param children 子节点
 * @description 创建一个虚拟节点   后面两个参数是在h函数调用时
 */
function createVNode(type, props, children) {
  const vnode = {
    type,
    props,
    component: {}, // 引用组件的实例,用来更新组件数据更新
    key: props && props.key,
    children,
    shapeFlag: getShapeFlag(type), // 元素类型标识
    el: null,
  };
  // 判断children是什么类型
  if (typeof children === "string") {
    vnode.shapeFlag |= 8 /* ShapeFlags.TEXT_CHILDREN */;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= 16 /* ShapeFlags.ARRAY_CHILDREN */;
  }
  // 判断是否为组件 & children为对象
  if (vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
    if (typeof children === "object") {
      vnode.shapeFlag |= 32 /* ShapeFlags.SLOTS_CHILDREN */;
    }
  }
  return vnode;
}
function createTextVNode(text) {
  return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
  return typeof type === "string"
    ? 1 /* ShapeFlags.ELEMENT */
    : 4 /* ShapeFlags.STATEFUL_COMPONENT */;
}

// import { render } from "./renderer";
function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      // 初始化
      mount(rootContainer) {
        const vnode = createVNode(rootComponent); // 根据rootComponent创建虚拟节点（对应虚拟DOM）
        render(vnode, rootContainer); // 挂载根组件
      },
    };
  };
}

function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;
  //   const emits = component!.emitsOptions;
  // 这里主要是检测组件的 props
  // 核心：只要是 props 发生改变了，那么这个 component 就需要更新
  // 1. props 没有变化，那么不需要更新
  if (prevProps === nextProps) {
    return false;
  }
  // 如果之前没有 props，那么就需要看看现在有没有 props 了
  // 所以这里基于 nextProps 的值来决定是否更新
  if (!prevProps) {
    return !!nextProps;
  }
  // 之前有值，现在没值，那么肯定需要更新
  if (!nextProps) {
    return true;
  }
  // 以上都是比较明显的可以知道 props 是否是变化的
  // 在 hasPropsChanged 会做更细致的对比检测
  return hasPropsChanged(prevProps, nextProps);
}
function hasPropsChanged(prevProps, nextProps) {
  // 依次对比每一个 props.key
  // 提前对比一下 length ，length 不一致肯定是需要更新的
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  // 只要现在的 prop 和之前的 prop 不一样那么就需要更新
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}

const queue = [];
let isFlushPending = false;
const resolvedPromise = /*#__PURE__*/ Promise.resolve();
const activePreFlushCbs = [];
function nextTick(fn) {
  // 返回一个微任务 使其在同步代码后执行
  return fn ? resolvedPromise.then(fn) : resolvedPromise;
}
/*
    把视图更新优化成异步任务
*/
function queueJob(job) {
  // 不存在则不添加   但是当前执行这里job一直是相同值,
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}
function queueFlush() {
  // 如果同时触发了两个组件的更新的话
  // 这里就会触发两次 then （微任务逻辑）
  // 但是着是没有必要的
  // 我们只需要触发一次即可处理完所有的 job 调用
  // 所以需要判断一下 如果已经触发过 nextTick 了
  // 那么后面就不需要再次触发一次 nextTick 逻辑了
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}
function flushJobs() {
  isFlushPending = false;
  // 先执行 pre 类型的 job
  // 所以这里执行的job 是在渲染前的
  // 也就意味着执行这里的 job 的时候 页面还没有渲染
  flushPreFlushCbs();
  let job;
  while ((job = queue.shift())) {
    console.log(job);
    job && job();
  }
}
function flushPreFlushCbs() {
  // 执行所有的 pre 类型的 job
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]();
  }
}

// createRenderer 实现自定义渲染器  需要没有 自定义渲染器 看分支runtime-core
function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  /**
   * @param vnode 节点
   * @param container App组件实例
   * @description  container为root时是 #app
   */
  function render(vnode, container) {
    patch(null, vnode, container, null, null);
  }
  /**
   * @description 基于vnode的类型进行不同类型的组件处理  patch(主要是用于递归渲染节点)
   * @param n1 老的vnode节点  如果不存在说明在初始化
   * @param n2 新的vnode节点
   */
  function patch(n1, n2, container, parentComponent = null, anchor) {
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment: // Fragment类型, 只需要渲染children. 插槽
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text: // 渲染children为纯文本节点
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
          console.log("处理 component");
          processComponent(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
          console.log("处理 element");
          proceessElement(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }
  function processText(n1, n2, container) {
    const { children } = n2;
    // 创建文本节点
    const textNode = document.createTextNode(children);
    // 添加文本节点
    container.append(textNode);
  }
  /**
   * @description 处理组件类型
   *
   * **/
  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      // 挂在组件
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }
  function mountComponent(initialVNode, container, parentComponent, anchor) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    console.log(`创建组件实例:${instance.type.name}`);
    // 初始组件属性
    setupComponent(instance);
    // 处理render函数
    setupRenderEffect(
      instance,
      initialVNode,
      container,
      parentComponent,
      anchor
    );
  }
  /**
   *
   * @description
   *  1、更新组件的数据
   *  2、调用组件的rander函数
   *  3、检查是否需要更新
   *
   */
  function updateComponent(n1, n2, container, parentComponent, anchor) {
    // n2可能时没有component需要初始化
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      // 那么 next 就是新的 vnode 了（也就是 n2）
      instance.next = n2; // 引用之前的虚拟节点
      // 这里的 update 是在 setupRenderEffect 里面初始化的，update 函数除了当内部的响应式对象发生改变的时候会调用
      // 还可以直接主动的调用(这是属于 effect 的特性)
      // 调用 update 再次更新调用 patch 逻辑
      // 在update 中调用的 next 就变成了 n2了
      // ps：可以详细的看看 update 中 next 的应用
      // TODO 需要在 update 中处理支持 next 的逻辑
      instance.update();
    } else {
      // 不需要更新的话，那么只需要覆盖下面的属性即可
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }
  function setupRenderEffect(
    instance,
    vnode,
    container,
    parentComponent,
    anchor
  ) {
    instance.update = effect(
      () => {
        //
        if (!instance.isMounted) {
          const { proxy } = instance;
          // 把代理对象绑定到render中; 缓存上一次的subTree
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ));
          // 把父级实例传入到渲染过程中 主要实现provide/inject功能
          patch(null, subTree, container, instance, anchor);
          // 获取当前的组件实例根节点
          vnode.el = subTree.el;
          instance.isMounted = true;
        } else {
          // 更新组件的Props
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          const { proxy } = instance;
          // 把代理对象绑定到render中
          const subTree = instance.render.call(proxy, proxy);
          const prevSubTree = instance.subTree; // 获取p之前的subTree
          // 更新subTree
          instance.subTree = subTree;
          // // 把父级实例传入到渲染过程中 主要实现provide/inject功能
          patch(prevSubTree, subTree, container, instance, anchor);
          // // 获取当前的组件实例根节点
          // vnode.el = subTree.el;
        }
      },
      {
        scheduler() {
          queueJob(instance.update);
        },
      }
    );
  }
  /*
      更新数据
        需要出发依赖是响应式发生更行, 在更具变化的值去对比是否需要发生更新.、
          1、首先判断是否为初始化
          2、需要获取上一次更新的subTree和当前的subTree进行递归对比
  
    */
  function proceessElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }
  // 经过上面的处理确定vnode.type是element string类型
  function mountElement(vnode, container, parentComponent, anchor) {
    // 创建对应的元素节点
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;
    // 判断是否有children，如果那么判断是字符串还是数据
    if (children) {
      if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
      } else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent, anchor);
      }
    }
    // 设置对应的props
    if (props) {
      for (let key in props) {
        const val = props[key];
        // if (!props.hasOwnProperty(key)) return;
        hostPatchProp(el, key, null, val);
      }
    }
    // 添加到对应的容器上
    hostInsert(el, container, anchor);
  }
  function patchElement(n1, n2, container, parentComponent, anchor) {
    const odlProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    // 更新n2 el
    const el = (n2.el = n1.el);
    patchProps(el, odlProps, newProps);
    // 注意传入的容器应该是当前el而不是container
    patchChildren(n1, n2, el, parentComponent, anchor);
  }
  /*
      四种情况:
        老的是 array 新的是 text
        老的是 text 新的是 text
        老的是 text 新的是 array
        老的是 array 新的是 array
     */
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapelag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
      if (prevShapelag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
        // 删除对应的节点
        unmountChildren(n1.children);
      }
      // 文本节点不想等时才去更新文本
      if (c1 !== c2) {
        // 设置文本节点
        hostSetElementText(container, c2);
      }
    } else {
      // 老的是 text 新的是 array
      if (prevShapelag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
        hostSetElementText(container, null);
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // 老的是 array 新的是 array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }
  function isSameVNodeType(n1, n2) {
    return (
      (n1 === null || n1 === void 0 ? void 0 : n1.type) ===
        (n2 === null || n2 === void 0 ? void 0 : n2.type) &&
      (n1 === null || n1 === void 0 ? void 0 : n1.key) ===
        (n2 === null || n2 === void 0 ? void 0 : n2.key)
    );
  }
  /**
   *
   * @description
   *  diff算法核心逻辑 也是vue3最核心的地方
   *
   */
  function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1; // 注意是从0开始的
    let e2 = l2 - 1;
    // 1、左则对比确定i的值
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        // 如果两个元素相同，需要递归判断执行children
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        // 如果元素不相同，则结束当前循环
        break;
      }
      i++;
    }
    // 2、右侧对比 定位出e1和e2的位置 方便删除或者添加元素
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        // 如果两个元素相同，需要递归判断执行children
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        // 如果元素不相同，则结束当前循环
        break;
      }
      e1--;
      e2--;
    }
    // 3、新的比老的长
    // 3.1 左侧对比 // 3.1 右侧对比
    // (a b)              (a b) 1 0
    // (a b) c            d c (a b) 12
    if (i > e1) {
      if (i <= e2) {
        // 如果使用 nextPos = i + 1 那么c2[i]会一直获取到c， anchor一直是null 渲染出来的结果就是 a b c d
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        // 循环渲染c2[i]新增的元素
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 4、左侧 (a b) c => (a b)； 右侧：a (b c) => (b c)
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      /*
              中间对比
              5.1
              a,b,(c,d),f,g
              a,b,(e,c),f,g
              i = 2, e1 = 3, e2 = 3
                          D 节点在新的里面是没有的 - 需要删除掉
                          C 节点 props 也发生了变化
            */
      // 1、设置对应的元素下标值
      const s1 = i;
      const s2 = i;
      /*
                下面两步
                    5.1.1
                        a,b,(c,e,d),f,g
                        a,b,(e,c),f,g
                        中间部分，老的比新的多， 那么多出来的直接就可以被干掉(优化删除逻辑)
            */
      const toBePatched = e2 - s2 + 1; // 新节点不同的总数  (e,c)  为
      // 记录新节点更新了几次
      let patched = 0;
      // 2、设置对应的映射
      const keyToNewIndexMap = new Map();
      /*
              5.2.1
              a,b,(c,d,e),f,g
              a,b,(e,c,d),f,g
            */
      // 创建一个定长的数组来优化性能
      const newIndexToOdlIndexMap = new Array();
      // 初始还数组 0 代表为null  反向遍历获取稳定的序列 因为左右两边是稳定的序列(左右两边对比得出)
      for (let j = toBePatched - 1; j >= 0; j--) newIndexToOdlIndexMap[j] = 0;
      let moved = false;
      let maxNewIndexSoFar = 0;
      // 3、循环c2设置对应的Map
      for (let j = s2; j <= e2; j++) {
        const nextChild = c2[j];
        keyToNewIndexMap.set(nextChild.key, j);
      }
      // 4、遍历新的节点
      for (let j = s1; j <= e1; j++) {
        const prevChild = c1[j];
        // 如果 patched 更新的节点 >= 新节点的总数 说明来节点还有新节点没有的节点,需要删除.
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex;
        // 当key存在时, 获取的对应的索引值
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 当key不存在时, 获取的对应的索引值
          for (let k = s2; k <= e2; k++) {
            if (isSameVNodeType(prevChild, c2[k])) {
              newIndex = k;
              break;
            }
          }
        }
        // 没有newIndex 说明在preChild中存在多余的vnode
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 这里判断元素是否需要移动, 因为如果c2元素是一个递增, 那么一定是不需要移动元素的. 上一个的newIndex一定比下一个的小.
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // 这里已经确保c1/c2 存在相同的元素(位置不一样)
          // 为什么要减去s2  newIndex是从c1第一个元素开始的, newIndexToOdlIndexMap是从不同(与c1对比过后)元素的位置开始
          newIndexToOdlIndexMap[newIndex - s2] = j + 1; // 需要注意的是i不能为0  所以需要+1
          // 递归查看children是否有更改
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      // 获取最长递增子序列
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOdlIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1; // 反向获取
      for (let k = toBePatched - 1; k >= 0; k--) {
        // 需要移动的位置  a,b,(e,c,d),f,g  s2 为 e 的下标值2; k 就需要移动的位置
        const nextIndex = s2 + k;
        const nextChild = c2[nextIndex]; // 获取需要移动的节点
        // anchor是插入元素的上一个元素
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        /*
                  判断元素是否需要创建  为0时 元素一定在老节点中不存在,则需要创建.
                    a,b,(c,e),f,g
                    a,b,(e,c,d),f,g
                */
        if (newIndexToOdlIndexMap[k] === 0) {
          // 为什么需要anchor? 因为需要知道添加到那个元素之前
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          // 判断当前节点是否需要移动
          if (j < 0 || k !== increasingNewIndexSequence[j]) {
            // 移动位置
            hostInsert(nextChild.el, container, anchor);
          } else {
            j++;
          }
        }
      }
    }
  }
  /*
      三种情况
        1、props 值发生了值的更新(不为null/undefined)
        2、props 值变为null/undefined 则删除
        3、老的props中的属性在新的props中不存在,则删除
    */
  function patchProps(el, odlProps, newProps) {
    if (odlProps !== newProps) {
      // 处理1和2
      for (const key in newProps) {
        const preProp = odlProps[key];
        const nextProp = newProps[key];
        if (preProp !== nextProp) {
          hostPatchProp(el, key, preProp, nextProp);
        }
      }
      if (odlProps !== EMPTY_OBJ) {
        // 处理3
        for (const key in odlProps) {
          // 把变化以后不存在的属性值删除
          if (!(key in newProps)) {
            const preProp = odlProps[key];
            hostPatchProp(el, key, preProp[key], null);
          }
        }
      }
    }
  }
  /**
   *
   *@description 递归处理children
   *
   */
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent, anchor);
    });
  }
  return {
    createApp: createAppAPI(render), // 返回一个函数
  };
}
function updateComponentPreRender(instance, nextNVode) {
  // 更新 nextVNode 的组件实例
  // 现在 instance.vnode 是组件实例更新前的
  // 所以之前的 props 就是基于 instance.vnode.props 来获取
  // 接着需要更新 vnode ，方便下一次更新的时候获取到正确的值
  instance.vnode = nextNVode;
  // TODO 后面更新 props 的时候需要对比
  // const prevProps = instance.vnode.props;
  instance.next = null;
  instance.props = nextNVode.props;
}
/**
 * @description
 *  获取最长递增子序列
 *  例子: [4, 2, 3, 1, 5] => [1, 2, 4](获取的的是下标值)
 *
 **/
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

function h(type, props, children) {
  return createVNode(type, props, children);
}

// 把slots转换成虚拟节点(主要处理slots为数组)
function renderSlots(slots, name = "default", props = {}) {
  const slot = slots[name];
  if (slot) {
    if (isFunction(slot)) {
      return createVNode(Fragment, {}, slot(props));
    }
  }
}

function provide(key, value) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent.provides;
    if (provides === parentProvides) {
      // 指向原型指向父级
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
function inject(key, defalutValue) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    // 获取到的就是父级上的provides  这样获取会导致中间层级的数据变化(key相同时)
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else {
      // 设置默认值
      if (isFunction(defalutValue)) {
        return defalutValue();
      } else {
        return defalutValue;
      }
    }
  }
}

function createElement(type) {
  return document.createElement(type);
}
function patchProp(el, key, odlProp, newProp) {
  // 判断是否为继承
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, newProp);
  } else {
    // 为空需要删除
    if (newProp === null || newProp === undefined || newProp === "") {
      el.removeAttribute(key, newProp);
    } else {
      el.setAttribute(key, newProp);
    }
  }
}
function insert(child, parent, anchor = null) {
  parent.insertBefore(child, anchor);
}
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}
function setElementText(el, text) {
  el.textContent = text;
}
const renderer = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});
const createApp = (...args) => {
  return renderer.createApp(...args); // 返回 对象 {mount(rootContainer){}}
};

var runtimeDom = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  ReactiveEffect: ReactiveEffect,
  computed: computed,
  createApp: createApp,
  createAppAPI: createAppAPI,
  createElementVNode: createVNode,
  createRenderer: createRenderer,
  createTextVNode: createTextVNode,
  effect: effect,
  getCurrentInstance: getCurrentInstance,
  h: h,
  inject: inject,
  isProxy: isProxy,
  isReactive: isReactive,
  isReadonly: isReadonly,
  isRef: isRef,
  nextTick: nextTick,
  provide: provide,
  proxyRefs: proxyRefs,
  reactive: reactive,
  readonly: readonly,
  ref: ref,
  registerRuntimeCompiler: registerRuntimeCompiler,
  renderSlots: renderSlots,
  shallowReadonly: shallowReadonly,
  stop: stop,
  toDisplayString: toDisplayString,
  unRef: unRef,
});

const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperNameMap = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

var NodeTypes;
(function (NodeTypes) {
  NodeTypes[(NodeTypes["INTERPOLATION"] = 0)] = "INTERPOLATION";
  NodeTypes[(NodeTypes["SIMPLE_EXPRESSION"] = 1)] = "SIMPLE_EXPRESSION";
  NodeTypes[(NodeTypes["ELEMENT"] = 2)] = "ELEMENT";
  NodeTypes[(NodeTypes["TEXT"] = 3)] = "TEXT";
  NodeTypes[(NodeTypes["ROOT"] = 4)] = "ROOT";
  NodeTypes[(NodeTypes["COMPOUND_EXPRESSION"] = 5)] = "COMPOUND_EXPRESSION";
})(NodeTypes || (NodeTypes = {}));
function createVNodeCall(context, tag, props, children) {
  if (context) {
    context.helper(CREATE_ELEMENT_VNODE);
  }
  return {
    // TODO vue3 里面这里的 type 是 VNODE_CALL
    // 是为了 block 而 mini-vue 里面没有实现 block
    // 所以创建的是 Element 类型就够用了
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
}

var tagType;
(function (tagType) {
  tagType[(tagType["START"] = 0)] = "START";
  tagType[(tagType["END"] = 1)] = "END";
})(tagType || (tagType = {}));
function baseParse(content) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
}
/**
 * @param context 节点对象
 * @param ancestors 存储标签的数组, 用于检查当前字符串模版是否有结束标签
 * @returns
 */
function parseChildren(context, ancestors) {
  const nodes = [];
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (startsWith(s, "{{")) {
      node = parseInterpolation(context);
    }
    // 判断是否问element类型 第一个元素为<, 第二个元素为字母
    else if (s[0] === "<") {
      // 第一个字符必须为  <
      if (/^[a-zA-Z]/.test(s[1])) {
        // 第二个字符必须为字母
        node = parseElement(context, ancestors);
      }
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}
function isEnd(context, ancestors) {
  // 2. 当遇到结束标签
  const s = context.source;
  if (startsWith(s, "</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      // 判断结束标签是否存在
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }
  // if (ancestors && s.startsWith(`</${ancestors}>`)) {
  //     return true;
  // }
  // source有值的时
  return !s;
}
function parseText(context) {
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];
  for (let i = 0, len = endTokens.length; i < len; i++) {
    let index = context.source.indexOf(endTokens[i]); // 获取 “{{” 前的字符串
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  // 1、获取context
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content: content,
  };
}
function parseElement(context, ancestors) {
  const node = parseTag(context, tagType.START);
  ancestors.push(node);
  node.children = parseChildren(context, ancestors);
  ancestors.pop();
  // 判断开始标签与结束标签是否相同
  if (startsWithEndTagOpen(context.source, node.tag)) {
    parseTag(context, tagType.END);
  } else {
    throw new Error(`缺失结束标签：${node.tag}`);
  }
  return node;
}
function startsWithEndTagOpen(source, tag) {
  // 1. 头部 是不是以  </ 开头的
  // 2. 看看是不是和 tag 一样
  return (
    startsWith(source, "</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}
function parseTag(context, type) {
  // 例子 <div></div>
  // 1、 解析tag
  const match = /^<\/?([a-zA-Z]*)/.exec(context.source);
  // console.log(match, 'match', context.source)
  const tag = match[1];
  // 2、删除处理完成的代码
  advanceBy(context, match[0].length); // ></div>
  advanceBy(context, 1); // </div>
  if (type === tagType.END) return; // 这里不需要生成新的tag 只是删除对应的字符串
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}
/**
 * @description 解析插值模版
 *
 */
function parseInterpolation(context) {
  // {{message}};
  const openDelimiter = "{{";
  const closeDelimiter = "}}";
  const closeIndex = context.source.indexOf("}}", openDelimiter.length); // 9
  advanceBy(context, openDelimiter.length); // message}}
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength); // message
  const content = rawContent.trim(); // 去除两边空格
  advanceBy(context, closeDelimiter.length); // 为空时 表明已经解析完成
  // console.log(content, 'content')
  // console.log(context.source, 'context.source')
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}
/**
 * @description
 *  1、获取文本
 *  2、删除对象中的文本, 为什么删除? 因为文本已经解析完成, 那么它已经没有实际作用了
 *
 */
function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}
function advanceBy(context, length) {
  context.source = context.source.slice(length);
}
//
function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT,
  };
}
//
function createParserContext(context) {
  return {
    source: context,
  };
}
function startsWith(source, searchString) {
  return source.startsWith(searchString);
}

function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  // 1、遍历 深度优先搜索
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
}
function traverseNode(node, context) {
  // 执行外部传入进来的回调函数(这里的用法也叫插件)
  const nodeTransforms = context.nodeTransforms;
  // 收集插件的函数  先进入后执行, 数组最后的先执行.
  const exitFns = [];
  for (let i = 0, len = nodeTransforms.length; i < len; i++) {
    const plugin = nodeTransforms[i];
    const exitFn = plugin(node, context);
    if (exitFn) {
      exitFns.push(exitFn);
    }
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
  }
  let i = exitFns.length;
  while (i--) {
    // 执行插件函数
    exitFns[i]();
  }
}
function traverseChildren(node, context) {
  const children = node.children;
  for (let i = 0, len = children.length; i < len; i++) {
    const _node = children[i];
    traverseNode(_node, context);
  }
}
function createTransformContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(), // 当如的变量 如 const { toDisplayString:_toDisplayString } = Vue
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}
function createRootCodegen(root) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    // 获取transformElement中的vnodeElement对象
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = child;
  }
}

function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}
function processExpression(node) {
  node.content = "_ctx." + node.content;
  return node;
}

function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    // 中间层处理
    return () => {
      context.helper(CREATE_ELEMENT_VNODE);
      // 处理成
      const vnodeTag = `"${node.tag}"`;
      const vnodeProps = node.props;
      const children = node.children;
      const vnodeChildren = children[0];
      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    };
  }
}

function isText(node) {
  return (
    (node === null || node === void 0 ? void 0 : node.type) ===
      NodeTypes.TEXT ||
    (node === null || node === void 0 ? void 0 : node.type) ===
      NodeTypes.INTERPOLATION
  );
}

function transformText(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let currentContainer;
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        if (isText(child)) {
          for (let j = i + 1, len = children.length; j < len; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push(" + ");
              currentContainer.children.push(next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}

function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;
  genFunctionPreamble(ast, context);
  push("return ");
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`function ${functionName}(${signature}) {`);
  const node = ast.codegenNode;
  push("return ");
  genNode(node, context);
  push("}");
  return {
    code: context.code,
  };
}
// 处理导入参数字符串处理 如: const { toDisplayString:_toDisplayString } = Vue
function genFunctionPreamble(ast, context) {
  const { push } = context;
  const vueBinging = "Vue";
  const aliasHelper = (s) => `${helperNameMap[s]}:_${helperNameMap[s]}`;
  if (ast.helpers.length > 0) {
    push(
      `const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${vueBinging} `
    );
  }
  push("\n");
}
// 处理不同类型的字符串
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
  }
}
function genCompoundExpression(node, context) {
  const { push } = context;
  const { children } = node;
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
    // const child = children[i];
  }
}
// 处理元素类型
function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  // genNode(children, context);
  genNodeList(genNullable([tag, props, children]), context);
  push(")");
}
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0, len = nodes.length; i < len; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(`${node}`);
    } else {
      genNode(node, context);
    }
    // node 和 node 之间需要加上 逗号(,)
    // 但是最后一个不需要 "div", [props], [children]
    if (i < len - 1) {
      push(", ");
    }
  }
}
// 处理undefined 为null
function genNullable(args) {
  return args.map((arg) => arg || "null");
}
// 处理 hi
function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}
// 处理  {{ message }} 类型
function genInterpolation(node, context) {
  const { push } = context;
  push(`${context.helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}
// 处理 message 类型
function genExpression(node, context) {
  const { push } = context;
  push(`${node.content}`);
}
// 当前对象的全局方法 利用它来简化代码 达到使代码修改统一, 使其可读性增加;
function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
  };
  return context;
}

function baseCompile(template) {
  const ast = baseParse(template);
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });
  return generate(ast);
}

// 出口
function compilerToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}
registerRuntimeCompiler(compilerToFunction);

export {
  ReactiveEffect,
  computed,
  createApp,
  createAppAPI,
  createVNode as createElementVNode,
  createRenderer,
  createTextVNode,
  effect,
  getCurrentInstance,
  h,
  inject,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  nextTick,
  provide,
  proxyRefs,
  reactive,
  readonly,
  ref,
  registerRuntimeCompiler,
  renderSlots,
  shallowReadonly,
  stop,
  toDisplayString,
  unRef,
};
