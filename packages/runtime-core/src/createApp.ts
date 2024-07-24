import { createVNode } from "./vnode";
// import { render } from "./renderer";

export function createAppAPI(render) {
  return function createApp(rootComponent) { // rootComponent =>   #app
    return {
      // 初始化
      mount(rootContainer) {
        const vnode = createVNode(rootComponent);  // 根据rootComponent创建虚拟节点（对应虚拟DOM）
        render(vnode, rootContainer); // 挂载根组件
      },
    };
  }
}
