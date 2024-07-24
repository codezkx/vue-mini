import { shallowReadonly, proxyRefs } from "@mini-vue/reactivity";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { emit } from "./componentEmit";
import { initSlots } from "./componentSlots";
import { initProps } from "./componentProps";

let currentInstance = null;

export function createComponentInstance(vnode, parent) {
  const component: any = {
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
export function setupComponent(instance) {
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
export function setupStatefulComponent(instance) {
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
  } else {
    finishComponentSetup(instance);
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
  // 给 instance 设置 render

  // 先取到用户设置的 component options
  const Component = instance.type; // type 时间实例
  if (!instance.render) {
    // 如果 compile 有值 并且当组件没有 render 函数，那么就需要把 template 编译成 render 函数
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
export function getCurrentInstance() {
  return currentInstance;
}

let compiler;
export function registerRuntimeCompiler(_compiler) {
  console.log(_compiler, '_compiler')
  compiler = _compiler;
}
