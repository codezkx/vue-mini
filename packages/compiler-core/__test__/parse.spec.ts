import { NodeTypes, ElementTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("Parse", () => {
    describe("interpolation", () => {
        test("simple interpolation", () => {
            const ast = baseParse("{{ message }}");
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: "message",
                }
            })   
        })
    });

    describe("element", () => {
        test("simple element div", () => {
            const ast = baseParse("<div></div>");
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: "div",
                children: [],
            })  
        })
    });

    describe("text", () => {
        test("simple text", () => {
            const ast = baseParse("some text");
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: "some text"
            })  
        })
    });

    test("element with interpolation and text", () => {
        const ast = baseParse("<div>hi,{{ msg }}</div>");
        const element = ast.children[0];
  
        expect(element).toStrictEqual({
          type: NodeTypes.ELEMENT,
          tag: "div",
        //   tagType: ElementTypes.ELEMENT,
          children: [
            {
              type: NodeTypes.TEXT,
              content: "hi,",
            },
            {
              type: NodeTypes.INTERPOLATION,
              content: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: "msg",
              },
            },
          ],
        });
    });

    test("Nested element", () => {
        const ast = baseParse("<div><p>hi</p>{{ msg }}</div>");
        const element = ast.children[0];
  
        expect(element).toStrictEqual({
          type: NodeTypes.ELEMENT,
          tag: "div",
          children: [
            {
                type: NodeTypes.ELEMENT,
                tag: "p",
                children: [
                    {
                      type: NodeTypes.TEXT,
                      content: "hi",
                    },
                ],
            },
            {
              type: NodeTypes.INTERPOLATION,
              content: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: "msg",
              },
            },
          ],
        });
    });

    test("should throw error when lack end tag  ", () => {
        expect(() => {
          baseParse("<div><span></div>");
        }).toThrow("缺失结束标签：span");
    });

});
