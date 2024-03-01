import { NodeTypes } from "./ast";

export enum tagType {
    START,
    END,
}

export function baseParse(content: string) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}

/**
 * @param context 节点对象
 * @param ancestors 存储标签的数组, 用于检查当前字符串模版是否有结束标签
 * @returns 
 */
function parseChildren(context, ancestors) {
    const nodes: any = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source
        if (startsWith(s ,"{{")) {
            node = parseInterpolation(context);
        } 
        // 判断是否问element类型 第一个元素为<, 第二个元素为字母
        else if (s[0] === "<") { // 第一个字符必须为  <
            if (/^[a-zA-Z]/.test(s[1])) { // 第二个字符必须为字母
                node = parseElement(context, ancestors);
            }
        } else {
            node = parseText(context);
        }
        nodes.push(node);
    }
    
    return nodes;
}

function isEnd(context, ancestors) {
    // 2. 当遇到结束标签
    const s = context.source
    if (startsWith(s, "</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag =  ancestors[i].tag;
            // 判断结束标签是否存在
            if (startsWithEndTagOpen(s, tag)) {
                return true
            }
        }
    }
    // if (ancestors && s.startsWith(`</${ancestors}>`)) {
    //     return true;
    // }
    // source有值的时
    return !s;
}

function parseText(context: any) {
    let endIndex = context.source.length;
    let endTokens = ["<" , "{{"];
    for (let i = 0, len = endTokens.length; i < len; i++) {
        let index = context.source.indexOf(endTokens[i]) // 获取 “{{” 前的字符串
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }
    // 1、获取context 
    const content = parseTextData(context, endIndex);

    return {
        type: NodeTypes.TEXT,
        content: content,
    }
}

function parseElement(context: any, ancestors) {
    const node: any = parseTag(context, tagType.START);
    ancestors.push(node)
    node.children = parseChildren(context, ancestors);
    ancestors.pop()
    // 判断开始标签与结束标签是否相同
    if (startsWithEndTagOpen(context.source, node.tag)) {
        parseTag(context, tagType.END);
    } else {
        throw new Error(`缺失结束标签：${node.tag}`)
    }
    return node;
}

function startsWithEndTagOpen(source: string, tag: string) {
 // 1. 头部 是不是以  </ 开头的
  // 2. 看看是不是和 tag 一样
  return (
    startsWith(source, "</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
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
        type: NodeTypes.ROOT,
    }
}

// 
function createParserContext(context: string) {
    return {
        source: context,
    }
}

function startsWith(source: string, searchString: string): boolean {
    return source.startsWith(searchString);
  }
