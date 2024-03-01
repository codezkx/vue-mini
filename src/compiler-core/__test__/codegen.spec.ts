import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { generate } from "../src/codegen";

describe('codegen', () => {
    it("string", () => {
        const ast = baseParse("hi");
        transform(ast);
        const { code } = generate(ast)

        // 快照: 1、抓BUG; 2、有意
        expect(code).toMatchSnapshot()
    }) 
})