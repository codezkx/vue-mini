import { isObject } from "@/shared/utils";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "@/shared/SgaoiFlags";

/**
 * @param vnode 节点
 * @param container App组件实例
 *
 *
 */
export function render(vnode, container) {
  patch(vnode, container);
}

/**
 * @description 基于vnode的类型进行不同类型的组件处理  patch(主要是用于递归渲染节点)
 *
 */
export function patch(vnode, container) {
  const { shapeFlags } = vnode;
  if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  } else if (shapeFlags & ShapeFlags.ELEMENT) {
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

export function mountComponent(initialVNode, container) {
  const instance: any = createComponentInstance(initialVNode);
  // 初始组件属性
  setupComponent(instance);
  // 处理render函数
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, vnode: any, container: any) {
  const { proxy } = instance;
  // 把代理对象绑定到render中
  const subTree = instance.render.call(proxy);
  patch(subTree, container);
  // 获取当前的组件实例根节点
  vnode.el = subTree.el;
}

// 处理元素
function proceessElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 经过上面的处理确定vnode.type是element string类型
function mountElement(vnode: any, container: any) {
  // 创建对应的元素节点
  const el = (vnode.el = document.createElement(vnode.type));
  const { children, props } = vnode;
  const { shapeFlags } = vnode;

  // 判断是否有children，如果那么判断是字符串还是数据
  if (children) {
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
  }

  // 设置对应的props
  if (props) {
    for (let prop in props) {
      // 判断是否为继承
      if (!props.hasOwnProperty(prop)) return;
      const val = props[prop];
      el.setAttribute(prop, val);
    }
  }
  // 添加到对应的容器上
  container.append(el);
}

/**
 *
 *@description 递归处理children
 *
 */
function mountChildren(children: any[], el: any) {
  children.forEach((vnode) => {
    patch(vnode, el);
  });
}
