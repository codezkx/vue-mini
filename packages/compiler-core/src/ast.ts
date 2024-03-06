import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers";

export enum NodeTypes {
    INTERPOLATION,  // 插值
    SIMPLE_EXPRESSION, // 模版表达式
    ELEMENT, // 元素
    TEXT, // 文本
    ROOT, // 根结点
    COMPOUND_EXPRESSION,
};

export const enum ElementTypes {
    ELEMENT,
}

export function createVNodeCall(context, tag, props?, children?) {
    if (context) {
      context.helper(CREATE_ELEMENT_VNODE);
    }
  
    return {
      // TODO vue3 里面这里的 type 是 VNODE_CALL
      // 是为了 block 而 mini-vue 里面没有实现 block 
      // 所以创建的是 Element 类型就够用了
      type: NodeTypes.ELEMENT,
      tag,
      props,
      children,
    };
  }