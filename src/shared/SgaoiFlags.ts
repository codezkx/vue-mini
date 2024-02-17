// 使用二进制表示不同类型
export const enum ShapeFlags {
  // 最后要渲染的 element 类型 00001
  ELEMENT = 1,
  // 组件类型 00010
  STATEFUL_COMPONENT = 1 << 2,
  // vnode 的 children 为 string 类型  00100
  TEXT_CHILDREN = 1 << 3,
  // vnode 的 children 为数组类型 001000
  ARRAY_CHILDREN = 1 << 4,
  // vnode 的 children 为 slots 类型  010000
  SLOTS_CHILDREN = 1 << 5,
}
