import {
  mutableHandler,
  readonlyHandlers,
  shallowReadonlyHhandlers,
} from "./baseHandlers";
import { ReactiveFlags } from "./constants";

export function reactive(row) {
  return createActiveObject(row, mutableHandler);
}

export function readonly(row) {
  return createActiveObject(row, readonlyHandlers);
}

export function isReactive(row) {
  // 获取target中的属性（即使不存在）会触发get
  return !!row?.[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(row) {
  return !!row?.[ReactiveFlags.IS_READONLY];
}

export function shallowReadonly(row) {
  return createActiveObject(row, shallowReadonlyHhandlers);
}

export function isProxy(row) {
  return isReactive(row) || isReadonly(row);
}

function createActiveObject(target, baseHandlers) {
  if (!target) {
    console.warn(`target ${target} 必须是一个对象`);
  }
  return new Proxy(target, baseHandlers);
}
