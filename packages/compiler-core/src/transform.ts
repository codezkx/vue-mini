import { NodeTypes } from "./ast";
import { helperNameMap, TO_DISPLAY_STRING } from "./runtimeHelpers"

export function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1、遍历 深度优先搜索
    traverseNode(root, context);
    createRootCodegen(root);

    root.helpers = [...context.helpers.keys()];
}

function traverseNode(node: any, context) {
    // 执行外部传入进来的回调函数(这里的用法也叫插件)
    const nodeTransforms = context.nodeTransforms;
    // 收集插件的函数  先进入后执行, 数组最后的先执行.
    const exitFns: any = [];
    for (let i = 0, len = nodeTransforms.length; i < len; i++) {
        const plugin = nodeTransforms[i];
        const exitFn = plugin(node, context);
        if (exitFn) {
            exitFns.push(exitFn);
        }
    }
    switch(node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING);
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context);
            break;
        default:
            break;
    }

    let i = exitFns.length;
    while (i--) {
        // 执行插件函数
        exitFns[i]();
    }
}

function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0, len = children.length; i < len; i++) {
        const _node = children[i];
        traverseNode(_node, context);
    }
}

function createTransformContext(root: any, options: any) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(), // 当如的变量 如 const { toDisplayString:_toDisplayString } = Vue
        helper(key) {
            context.helpers.set(key, 1);
        }
    }
    return context;
}

function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === NodeTypes.ELEMENT) {
        // 获取transformElement中的vnodeElement对象
        root.codegenNode = child.codegenNode;
    } else {
        root.codegenNode = child
    }
}

