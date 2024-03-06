import { NodeTypes } from "../ast";
import { isText } from "../utils";

export function transformText(node, context) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0, len = children.length; i < len; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1, len = children.length; j < len; j++) {
                        const next = children[j]
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: NodeTypes.COMPOUND_EXPRESSION,
                                    children: [child],
                                }
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--
                        } else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        }
    }
}
