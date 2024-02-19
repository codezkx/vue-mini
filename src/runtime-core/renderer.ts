import { createComponentInstance, setupComponent } from "./component";
import { EMPTY_OBJ, ShapeFlags } from "@/shared";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "@/reactivity/src";

// createRenderer 实现自定义渲染器  需要没有 自定义渲染器 看分支runtime-core
export function createRenderer(options) {
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
   *
   */
  function render(vnode, container) {
    patch(null, vnode, container);
  }

  /**
   * @description 基于vnode的类型进行不同类型的组件处理  patch(主要是用于递归渲染节点)
   * @param n1 老的vnode节点  如果不存在说明在初始化
   * @param n2 新的vnode节点
   */
  function patch(n1, n2, container, parentComponent = null) {
    const { type, shapeFlag } = n2;

    switch (type) {
      case Fragment: // Fragment类型, 只需要渲染children. 插槽
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text: // 渲染children为纯文本节点
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          proceessElement(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processFragment(n1, n2, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
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
  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(initialVNode, container, parentComponent) {
    const instance: any = createComponentInstance(
      initialVNode,
      parentComponent
    );
    // 初始组件属性
    setupComponent(instance);
    // 处理render函数
    setupRenderEffect(instance, initialVNode, container, parentComponent);
  }

  function setupRenderEffect(
    instance: any,
    vnode: any,
    container: any,
    parentComponent
  ) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 把代理对象绑定到render中; 缓存上一次的subTree
        const subTree = (instance.subTree = instance.render.call(proxy));
        // 把父级实例传入到渲染过程中 主要实现provide/inject功能
        patch(null, subTree, container, instance);
        // 获取当前的组件实例根节点
        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        // 把代理对象绑定到render中
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree; // 获取之前的subTree
        // 更新subTree
        instance.subTree = subTree;
        // // 把父级实例传入到渲染过程中 主要实现provide/inject功能
        patch(prevSubTree, subTree, container, instance);
        // // 获取当前的组件实例根节点
        // vnode.el = subTree.el;
      }
    });
  }

  /*
    更新数据
      需要出发依赖是响应式发生更行, 在更具变化的值去对比是否需要发生更新.、
        1、首先判断是否为初始化
        2、需要获取上一次更新的subTree和当前的subTree进行递归对比

  */
  function proceessElement(n1, n2: any, container: any, parentComponent) {
    // n1不存在说明在初始化
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  // 经过上面的处理确定vnode.type是element string类型
  function mountElement(vnode: any, container: any, parentComponent) {
    // 创建对应的元素节点
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props } = vnode;
    const { shapeFlag } = vnode;

    // 判断是否有children，如果那么判断是字符串还是数据
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el, parentComponent);
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
    hostInsert(el, container);
  }

  function patchElement(n1, n2, container, parentComponent) {
    const odlProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    // 更新n2 el
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, container, parentComponent);
    patchProps(el, odlProps, newProps);
  }

  /* 
    四种情况:
      老的是 array 新的是 text
      老的是 text 新的是 text
      老的是 text 新的是 array
      老的是 array 新的是 array
   */
  function patchChildren(n1, n2, container, parentComponent) {
    const prevShapelag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapelag & ShapeFlags.ARRAY_CHILDREN) {
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
      if (prevShapelag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, null);
        mountChildren(c2, container, parentComponent);
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
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
  function mountChildren(children: any[], el: any, parentComponent) {
    children.forEach((vnode) => {
      patch(null, vnode, el, parentComponent);
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
