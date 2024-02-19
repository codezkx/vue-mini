import { isFunction } from "@/shared";
import { createVnode } from "./vnode";

// 把slots转换成虚拟节点(主要处理slots为数组)
export function renderSlots(slots, name = "default", props = {}) {
    const slot = slots[name];
    if (slot) {
        if (isFunction(slot)) {
            return createVnode("div", {}, slot(props));
        }
    }
}