import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import { CREATE_ELEMENT_VNODE, helperNameMap, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    push("return ");
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ")
    push(`function ${functionName}(${signature}) {`);
    const node = ast.codegenNode;
    push("return ");
    genNode(node, context)
    push("}")
    return {
        code: context.code,
    }
}

// 处理导入参数字符串处理 如: const { toDisplayString:_toDisplayString } = Vue 
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const vueBinging = "Vue";
    const aliasHelper = (s) => `${helperNameMap[s]}:_${helperNameMap[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${vueBinging} `);
    }
    push("\n");
}

// 处理不同类型的字符串
function genNode(node, context) {
    switch(node.type) {
        case NodeTypes.TEXT:
            genText(node, context);
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context);
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context);
            break;
        case NodeTypes.ELEMENT:
            genElement(node, context)
            break;
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node, context);
            break;
        default:
            break;
    }
}

function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        } else {
            genNode(child, context);
        }
        // const child = children[i];
    }
}

// 处理元素类型
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // genNode(children, context);
    genNodeList(genNullable([tag, props, children]), context)
    push(')');
}

function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0, len = nodes.length; i < len; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(`${node}`);
        } else {
            genNode(node, context);
        }
        // node 和 node 之间需要加上 逗号(,)
        // 但是最后一个不需要 "div", [props], [children]
        if (i < len - 1) {
            push(", ");
        } 
    }
}

// 处理undefined 为null
function genNullable(args) {
    return args.map(arg => arg || 'null');
}

// 处理 hi
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}

// 处理  {{ message }} 类型
function genInterpolation(node, context) {
    const { push } = context;
    push(`${context.helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}

// 处理 message 类型
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}

// 当前对象的全局方法 利用它来简化代码 达到使代码修改统一, 使其可读性增加;
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source 
        },
        helper(key) {
            return `_${helperNameMap[key]}`
        }
    }
    return context;
}
