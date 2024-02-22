import { ShapeFlags } from "@/shared";

// 用 symbol 作为唯一标识
export const Text = Symbol("Text"); // 纯文本节点
export const Fragment = Symbol("Fragment"); // 只渲染children

/**
 * @param type Object | string
 * @param props 节点属性
 * @param children 子节点
 * @description 创建一个虚拟节点   后面两个参数是在h函数调用时
 */
export function createVNode(type, props?, children?) {
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
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // 判断是否为组件 & children为对象
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
  return vnode;
}

export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
