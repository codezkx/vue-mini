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
        if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          proceessElement(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processFragment(n1, n2, container: any, parentComponent, anchor) {
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
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    const instance: any = createComponentInstance(
      initialVNode,
      parentComponent
    );
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

  function setupRenderEffect(
    instance: any,
    vnode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        // 把代理对象绑定到render中; 缓存上一次的subTree
        const subTree = (instance.subTree = instance.render.call(proxy));
        // 把父级实例传入到渲染过程中 主要实现provide/inject功能
        patch(null, subTree, container, instance, anchor);
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
        patch(prevSubTree, subTree, prevSubTree.el, instance, anchor);
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
  function proceessElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  // 经过上面的处理确定vnode.type是element string类型
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    // 创建对应的元素节点
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;

    // 判断是否有children，如果那么判断是字符串还是数据
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
    patchChildren(n1, n2, container, parentComponent, anchor);
  }

  /* 
    四种情况:
      老的是 array 新的是 text
      老的是 text 新的是 text
      老的是 text 新的是 array
      老的是 array 新的是 array
   */
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    console.log(n1.key, n2.key);
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
    return n1?.type === n2?.type && n1?.key === n2?.key;
  }

  /* 
    
  
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
			let patched = 0; // 记录新节点更新了几次

      // 2、设置对应的映射
      const keyToNewIndexMap = new Map();

      // 3、循环c2设置对应的Map
      for (let j = s2; j <= e2; j++) {
        const nextChild: any = c2[j];
        keyToNewIndexMap.set(nextChild.key, j);
      }

      // 4、遍历新的节点
      for (let j = s1; j <= e1; j++) {
        const prevChild = c1[j];
				// 如果 patched 更新的节点 >= 新节点的总数 说明来节点还有新节点没有的节点,需要删除.
				if (patched >= toBePatched) {
					hostRemove(prevChild.el)
					continue;
				}

        let newIndex;
        // 当key存在时, 获取的对应的索引值
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 当key不存在时, 获取的对应的索引值
          for (let k = s2; k < e2; k++) {
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
          // 递归查看children是否有更改
          patch(prevChild, c2[newIndex], container, parentComponent, null);
					patched++;
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
  function mountChildren(
    children: any[],
    container: any,
    parentComponent,
    anchor
  ) {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent, anchor);
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
