import { isOn } from "@mini-vue/shared";
import { createRenderer } from "@mini-vue/runtime-core";

function createElement(type) {
  console.log("CreateElement", type);
  return document.createElement(type);
}

function patchProp(el, key, odlProp, newProp) {
  // preValue 之前的值
  // 为了之后 update 做准备的值
  // nextValue 当前的值
  console.log(`PatchProp 设置属性:${key} 值:${newProp}`);
  console.log(`key: ${key} 之前的值是:${odlProp}`);
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
  console.log("Insert");
  parent.insertBefore(child, anchor);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  console.log("SetElementText", el, text);
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
  return renderer.createApp(...args); // 返回 对象 {mount(rootContainer){}}
};

export * from "@mini-vue/runtime-core";
