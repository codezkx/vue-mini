import { NodeTypes } from "./ast";
import { helperNameMap, TO_DISPLAY_STRING } from "./runtimeHelpers";

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
    }
}

// 处理 hi
function genText(node, context) {
    const { push } = context;
    push(`return '${node.content}'`);
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
