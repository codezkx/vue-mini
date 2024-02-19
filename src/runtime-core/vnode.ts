import { isObject, ShapeFlags } from "@/shared";

/**
 * @param type Object | string
 * @param props 节点属性
 * @param children 子节点
 * @description 创建一个虚拟节点   后面两个参数是在h函数调用时
 */
export function createVnode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlags: getShapeFlag(type), // 元素类型标识
    el: null,
  };
  // 判断children是什么类型
  if (typeof children === "string") {
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
  }

  // 判断是否为组件 & children为对象
  if (vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlags |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
  return vnode;
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
