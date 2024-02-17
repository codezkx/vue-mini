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
    el: null,
  };
  return vnode;
}
