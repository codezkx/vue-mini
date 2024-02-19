import { createRenderer } from "@/runtime-core"
import { isOn } from "@/shared";

function createElement(type) {
    return document.createElement(type);
}

function patchProp(el, key, val) {
    // 判断是否为继承
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    }
    el.setAttribute(key, val);
}

function insert(child, parent) {
    parent.append(child);
}

const renderer: any = createRenderer({createElement, patchProp, insert});

export const createApp = (...args) => {
    return renderer.createApp(...args)
};

export * from "@/runtime-core";
