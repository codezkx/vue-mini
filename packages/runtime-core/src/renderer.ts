import { EMPTY_OBJ, ShapeFlags } from "@mini-vue/shared";
import { effect } from "@mini-vue/reactivity";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text, normalizeVNnode } from "./vnode";
import { createAppAPI } from "./createApp";
import { shouldUpdateComponent } from "./componentRenderUtils";
import { queueJob } from "./scheduler";

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
        if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          console.log("处理 component");
          processComponent(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          console.log("处理 element");
          processElement(n1, n2, container, parentComponent, anchor);
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
    if (!n1) {
      // 挂在组件
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2, container, parentComponent, anchor);
    }
  }

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    const instance: any = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    console.log(`创建组件实例:${instance.type.name}`);
    // 初始组件属性  Props/slots/render
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
    console.log("更新组件", n1, n2);

    // n2可能时没有component需要初始化
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      console.log(`组件需要更新: ${instance}`);

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
      console.log(`组件不需要更新: ${instance}`);
      // 不需要更新的话，那么只需要覆盖下面的属性即可
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function setupRenderEffect(
    instance: any,
    vnode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 调用 render
    // 应该传入 ctx 也就是 proxy
    // ctx 可以选择暴露给用户的 api
    // 源代码里面是调用的 renderComponentRoot 函数
    // 这里为了简化直接调用 render

    // obj.name  = "111"
    // obj.name = "2222"
    // 从哪里做一些事
    // 收集数据改变之后要做的事 (函数)
    // 依赖收集   effect 函数
    // 触发依赖
    instance.update = effect(
      () => {
        //
        if (!instance.isMounted) {
          console.log(`${instance.type.name}:调用 render,获取 subTree`);
          // proxy 是代理instance对象
          const { proxy } = instance;
          // 把代理对象绑定到render中; 缓存上一次的subTree   可在 render 函数中通过 this 来使用 proxy
          const subTree = (instance.subTree = normalizeVNnode(
            instance.render.call(proxy, proxy)
          ));
          console.log("subTree", subTree);
          // todo
          console.log(`${instance.type.name}:触发 beforeMount hook`);
          console.log(`${instance.type.name}:触发 onVnodeBeforeMount hook`);
          // 把父级实例传入到渲染过程中 主要实现provide/inject功能
          patch(null, subTree, container, instance, anchor);
          // 获取当前的组件实例根节点
          vnode.el = subTree.el;

          console.log(`${instance.type.name}:触发 mounted hook`);
          instance.isMounted = true; // DOM初始化完成
        } else {
          // 响应式的值变更后会从这里执行逻辑
          // 主要就是拿到新的 vnode ，然后和之前的 vnode 进行对比
          console.log(`${instance.type.name}:调用更新逻辑`);

          // 如果有 next 的话， 说明需要更新组件的数据（props，slots 等）
          // 先更新组件的数据，然后更新完成后，在继续对比当前组件的子元素
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

          // 触发 beforeUpdated hook
          console.log(`${instance.type.name}:触发 beforeUpdated hook`);
          console.log(`${instance.type.name}:触发 onVnodeBeforeUpdate hook`);

          // // 把父级实例传入到渲染过程中 主要实现provide/inject功能
          patch(prevSubTree, subTree, container, instance, anchor);
          // // 获取当前的组件实例根节点
          // vnode.el = subTree.el;

          // 触发 updated hook
          console.log(`${instance.type.name}:触发 updated hook`);
          console.log(`${instance.type.name}:触发 onVnodeUpdated hook`);
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
  function processElement(
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
        // 举个栗子
        // render(){
        //     return h("div",{},"test")
        // }
        // 这里 children 就是 test ，只需要渲染一下就完事了
        // el.textContent = children;
        console.log(`处理文本:${vnode.children}`);
        hostSetElementText(el, vnode.children);
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 举个栗子
        // render(){
        // Hello 是个 component
        //     return h("div",{},[h("p"),h(Hello)])
        // }
        // 这里 children 就是个数组了，就需要依次调用 patch 递归来处理
        mountChildren(children, el, parentComponent, anchor);
      }
    }

    // 设置对应的props
    if (props) {
      for (let key in props) {
        // todo
        // 需要过滤掉vue自身用的key
        // 比如生命周期相关的 key: beforeMount、mounted
        const val = props[key];
        // if (!props.hasOwnProperty(key)) return;
        hostPatchProp(el, key, null, val);
      }
    }
    // 触发 beforeMount() 钩子
    console.log("vnodeHook  -> onVnodeBeforeMount");
    console.log("DirectiveHook  -> beforeMount");
    console.log("transition  -> beforeEnter");
    // 添加到对应的容器上
    hostInsert(el, container, anchor);
    // todo
    // 触发 mounted() 钩子
    console.log("vnodeHook  -> onVnodeMounted");
    console.log("DirectiveHook  -> mounted");
    console.log("transition  -> enter");
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    const odlProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    // 应该更新 element
    console.log("应该更新 element");
    console.log("旧的 vnode", n1);
    console.log("新的 vnode", n2);
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

  /**
   * @param c1 老节点
   * @param c2 新节点
   * @param container 容器
   * @param parentComponent 父容器
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
    // 1、左则对比确定i的值  i 是从0开始的
    // (a b) c  2
    // (a b) d e  3
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        // 如果两个元素相同，需要递归判断执行children
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        console.log("两个 child 不相等(从左往右比对)");
        console.log(`prevChild:${n1}`);
        console.log(`nextChild:${n2}`);
        // 如果元素不相同，则结束当前循环
        break;
      }
      i++;
    }
    // 2、右侧对比 定位出e1和e2的位置 方便删除或者添加元素
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        console.log(
          "两个 child 相等，接下来对比这两个 child 节点(从右往左比对)"
        );
        // 如果两个元素相同，需要递归判断执行children
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        console.log("两个 child 不相等(从右往左比对)");
        console.log(`prevChild:${n1}`);
        console.log(`nextChild:${n2}`);
        // 如果元素不相同，则结束当前循环
        break;
      }
      e1--;
      e2--;
    }
    // 3、新的比老的长
    // 3.1 左侧对比 // 3.1 右侧对比
    // (a b)   e1 = 1  ℹ = 2        (a b) 1 0   e1 = 1  ℹ = 2
    // (a b) c d  e2 = 3           d c (a b) 12  e1 = 3  ℹ = 2
    if (i > e1) {
      if (i <= e2) {
        // 如果使用 nextPos = i + 1 那么c2[i]会一直获取到c， anchor一直是null 渲染出来的结果就是 a b c d
        // 如果是这种情况的话就说明 e2 也就是新节点的数量大于旧节点的数量
        // 也就是说新增了 vnode
        // 应该循环 c2
        // 锚点的计算：新的节点有可能需要添加到尾部，也可能添加到头部，所以需要指定添加的问题
        // 要添加的位置是当前的位置(e2 开始)+1
        // 因为对于往左侧添加的话，应该获取到 c2 的第一个元素
        // 所以我们需要从 e2 + 1 取到锚点的位置
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        // 循环渲染c2[i]新增的元素
        while (i <= e2) {
          console.log(`需要新创建一个 vnode: ${c2[i].key}`);
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 4、左侧 (a b) c => (a b)； 右侧：a (b c) => (b c)
      while (i <= e1) {
        console.log(`需要删除当前的 vnode: ${c1[i].key}`);
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
      const newIndexToOldIndexMap = new Array();
      // 初始还数组 0 代表为null  反向遍历获取稳定的序列 因为左右两边是稳定的序列(左右两边对比得出)
      for (let j = toBePatched - 1; j >= 0; j--) newIndexToOldIndexMap[j] = 0;

      let moved = false;
      let maxNewIndexSoFar = 0;

      // 3、循环c2设置对应的Map   取其变化的位置的部分
      for (let j = s2; j <= e2; j++) {
        const nextChild: any = c2[j];
        keyToNewIndexMap.set(nextChild.key, j);
      }

      // 4、遍历老节点
      // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
      // 2. 新老节点都有的，—> 需要 patch
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
          newIndexToOldIndexMap[newIndex - s2] = j + 1; // 需要注意的是i不能为0  所以需要+1
          // 递归查看children是否有更改
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      // 利用最长递增子序列来优化移动逻辑
      // 因为元素是升序的话，那么这些元素就是不需要移动的
      // 而我们就可以通过最长递增子序列来获取到升序的列表
      // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
      // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
      // getSequence 返回的是 newIndexToOldIndexMap 的索引值
      // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []; // 获取最长递增子序列
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
        if (newIndexToOldIndexMap[k] === 0) {
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
  function mountChildren(
    children: any[],
    container: any,
    parentComponent,
    anchor
  ) {
    children.forEach((vnode) => {
      // todo
      // 这里应该需要处理一下 vnodeChild
      // 因为有可能不是 vnode 类型
      console.log("mountChildren:", vnode);
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
function getSequence(arr: number[]): number[] {
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
