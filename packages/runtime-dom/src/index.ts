import { isOn } from "@mini-vue/shared";
import { createRenderer } from "@mini-vue/runtime-core";

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

function insert(child, parent, anchor = null) {
  parent.insertBefore(child, anchor);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export const createApp = (...args) => {
  return renderer.createApp(...args);
};

export * from "@mini-vue/runtime-core";
