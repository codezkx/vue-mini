import { NodeTypes, createVNodeCall } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
    if (node.type === NodeTypes.ELEMENT) {
        // 中间层处理
        return () => {
            context.helper(CREATE_ELEMENT_VNODE);
            // 处理成
            const vnodeTag = `"${node.tag}"`;
            const vnodeProps = node.props;
            const children = node.children;
            const vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        }
    }
}
