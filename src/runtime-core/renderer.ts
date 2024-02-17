import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

/**
 * @description 基于vnode的类型进行不同类型的组件处理  patch(主要是用于递归渲染节点)
 *
 */
export function patch(vnode, container) {
  if (typeof vnode.type === "object") {
    processComponent(vnode, container);
  } else if (typeof vnode.type === "string") {
    proceessElement(vnode, container);
  }
}

/**
 * @description 处理组件类型
 *
 * **/
export function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

export function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  // 初始组件属性
  setupComponent(instance);
  // 处理render函数
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance: any, vnode: any, container: any) {
  const subTree = instance.render();

  patch(subTree, container);
}

function proceessElement(vnode: any, container: any) {
  throw new Error("Function not implemented.");
}