import { NodeTypes } from "./ast";

export function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1、遍历 深度优先搜索
    traverseNode(root, context);

    createRootCodegen(root);
}

function traverseNode(node: any, context) {
    // 执行外部传入进来的回调函数(这里的用法也叫插件)
    const nodeTransforms = context.nodeTransforms;
    for (let i = 0, len = nodeTransforms.length; i < len; i++) {
        const plugin = nodeTransforms[i];
        plugin && plugin(node);
    }
    traverseChildren(node, context);

}

function traverseChildren(node, context) {
    const children = node.children;
    if (children) {
        for (let i = 0, len = children.length; i < len; i++) {
            const _node = children[i];
            traverseNode(_node, context);
        }
    }
}
function createTransformContext(root: any, options: any) {
    return {
        root,
        nodeTransforms: options.nodeTransforms || [],
    }
}

function createRootCodegen(root) {
    root.codegenNode = root.children[0];
}

