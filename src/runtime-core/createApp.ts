import { createVnode } from "./vnode";
import { render } from "./renderer";

export function createApp(rootContainer) {
  return {
    // 初始化
    mount(rootContainer) {
      // vue创建虚拟节点（对应虚拟DOM）
      const vnode = createVnode(rootContainer);
      render(vnode, rootContainer);
    },
  };
}
