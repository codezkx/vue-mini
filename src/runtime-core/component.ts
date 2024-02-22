import { shallowReadonly } from "@/reactivity/src/reactive";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { emit } from "./componentEmit";
import { initSlots } from "./componentSlots";
import { initProps } from "./componentProps";
import { isObject } from "@/shared";
import { proxyRefs } from "@/reactivity/src";

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
  setupStatefulComponent(instance);
}

// 获取setup返回值
export function setupStatefulComponent(instance) {
  const Component = instance.type;
  // 创建一个代理对象
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    // 在setup之前赋值
    setCurrentInstance(instance);
    /**
     * @description 注意这里可能返回一个函数或者一个对象
     * @returns {
     *    function: 是一个渲染函数（render）
     *    Object：需要把此对象注入到instance的上下文中不然rander函数不能通过this访问到setup中返回的数据
     * }
     */
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}

// 处理setup中返回的类型 function(就是渲染函数) | object（需要通过渲染函数）
function handleSetupResult(instance, setupResult) {
  // todo Function
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

// 确保实例对象上有render函数
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (Component.render) {
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
