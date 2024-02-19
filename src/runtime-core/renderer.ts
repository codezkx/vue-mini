import { isOn } from "@/shared";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "@/shared/SgaoiFlags";
import { Fragment, Text } from "./vnode";

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
export function patch(vnode, container, parentComponent = null) {
  const { type, shapeFlags } = vnode;

  switch(type) {
    case Fragment: // Fragment类型, 只需要渲染children. 插槽
      processFragment(vnode, container, parentComponent);
      break;
    case Text: // 渲染children为纯文本节点
      processText(vnode, container);
      break;
    default:
      if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parentComponent);
      } else if (shapeFlags & ShapeFlags.ELEMENT) {
        proceessElement(vnode, container, parentComponent);
      }
      break;
  }
}

function processFragment(vnode: any, container: any, parentComponent) {
  mountChildren(vnode.children, container, parentComponent)
}

function processText(vnode, container) {
  const { children } = vnode;
  // 创建文本节点
  const textNode = document.createTextNode(children);
  // 添加文本节点
  container.append(textNode)
}

/**
 * @description 处理组件类型
 *
 * **/
export function processComponent(vnode, container, parentComponent) {
  mountComponent(vnode, container, parentComponent);
}

export function mountComponent(initialVNode, container, parentComponent) {
  const instance: any = createComponentInstance(initialVNode, parentComponent);
  // 初始组件属性
  setupComponent(instance);
  // 处理render函数
  setupRenderEffect(instance, initialVNode, container, parentComponent);
}

function setupRenderEffect(instance: any, vnode: any, container: any, parentComponent) {
  const { proxy } = instance;
  // 把代理对象绑定到render中
  const subTree = instance.render.call(proxy);
  // 把父级实例传入到渲染过程中 主要实现provide/inject功能
  patch(subTree, container, instance);
  // 获取当前的组件实例根节点
  vnode.el = subTree.el;
}

// 处理元素
function proceessElement(vnode: any, container: any, parentComponent) {
  mountElement(vnode, container, parentComponent);
}

// 经过上面的处理确定vnode.type是element string类型
function mountElement(vnode: any, container: any, parentComponent) {
  // 创建对应的元素节点
  const el = (vnode.el = document.createElement(vnode.type));
  const { children, props } = vnode;
  const { shapeFlags } = vnode;

  // 判断是否有children，如果那么判断是字符串还是数据
  if (children) {
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }
  }

  // 设置对应的props
  if (props) {
    for (let prop in props) {
      // 判断是否为继承
      if (!props.hasOwnProperty(prop)) return;
      if (isOn(prop)) {
        const event = prop.slice(2).toLowerCase();
        el.addEventListener(event, props[prop]);
      }
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
function mountChildren(children: any[], el: any, parentComponent) {
  children.forEach((vnode) => {
    patch(vnode, el, parentComponent);
  });
}
