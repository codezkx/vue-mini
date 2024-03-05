import { baseParse } from "../src/parse";
import { transform } from "./transform";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformElement } from "../src/transforms/transformElement";
import { transformText } from "../src/transforms/transformText";
import { generate } from "./codegen";

export function baseCompile(template) {
    const ast: any = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}