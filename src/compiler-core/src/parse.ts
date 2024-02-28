import { NodeTypes } from "./ast";

export enum tagType {
    START,
    END,
}

export function baseParse(content: string) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context));
}

// 
function parseChildren(context) {
    const nodes: any = [];
    let node;
    const s = context.source
    if (s.startsWith("{{")) {
        node = parseInterpolation(context);
    } 
    // 判断是否问element类型 第一个元素为<, 第二个元素为字母
    else if (s[0] === "<") { // 第一个字符必须为  <
        if (/^[a-zA-Z]/.test(s[1])) { // 第二个字符必须为字母
            node = parseElement(context);
        }
    } else {
        node = parseText(context);
    }
    nodes.push(node);
    return nodes;
}

function parseText(context: any) {
    // 1、获取context
    const content = parseTextData(context, context.source.length);
    return {
        type: NodeTypes.TEXT,
        context: content,
    }
}

function parseElement(context: any) {
    const node = parseTag(context, tagType.START);
    parseTag(context, tagType.END);
    return node;
}

function parseTag(context: any, type) {
    // 例子 <div></div>
    // 1、 解析tag
    const match: any = /^<\/?([a-zA-Z]*)/.exec(context.source);
    // console.log(match, 'match', context.source)
    const tag = match[1];
    // 2、删除处理完成的代码
    advanceBy(context, match[0].length); // ></div>
    advanceBy(context, 1); // </div>

    if(type === tagType.END) return; // 这里不需要生成新的tag 只是删除对应的字符串
    return {
        type: NodeTypes.ELEMENT,
        tag,
    }
}

/**
 * @description 解析插值模版
 * 
*/
function parseInterpolation(context) {
    // {{message}};
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf("}}", openDelimiter.length); // 9

    advanceBy(context, openDelimiter.length) // message}}
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength); // message
    const content = rawContent.trim() // 去除两边空格
    advanceBy(context, closeDelimiter.length); // 为空时 表明已经解析完成
    // console.log(content, 'content')
    // console.log(context.source, 'context.source')
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        }
    }
}

/**
 * @description 
 *  1、获取文本
 *  2、删除对象中的文本, 为什么删除? 因为文本已经解析完成, 那么它已经没有实际作用了
 * 
*/
function parseTextData(context: any, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}

function advanceBy(context: any, length: number) {
    context.source = context.source.slice(length);
}

// 
function createRoot(children) {
    return {
        children,
    }
}

// 
function createParserContext(context: string) {
    return {
        source: context,
    }
}
