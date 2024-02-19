import { createRenderer } from "@/runtime-core"
import { isOn } from "@/shared";

function createElement(type) {
    return document.createElement(type);
}

function patchProp(el, key, odlProp, newProp) {
    // 判断是否为继承
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, newProp);
    } else {
        // 为空需要删除
        if (newProp === null || newProp === undefined || newProp === "") {
            el.removeAttribute(key, newProp);
        } else {
            el.setAttribute(key, newProp);
        }
    }
}

function insert(child, parent) {
    parent.append(child);
}

const renderer: any = createRenderer({createElement, patchProp, insert});

export const createApp = (...args) => {
    return renderer.createApp(...args)
};

export * from "@/runtime-core";
