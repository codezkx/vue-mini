import { track, trigger } from "@/reactivity/src/effect";
import { ReactiveFlags } from "./constants";
import { extend, isObject } from "@/shared";
import { reactive, readonly } from "./reactive";

/* 
  优化点 当get执行时不需要每次调用createGetter或者createSetter，所以只需要模块引用时执行一次即可(利用缓存技术)
*/
const get = createGetter(false);
const set = createSetter();

const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

export const mutableHandler = { get, set };

function createGetter(isReadonly = false, isShallow = false) {
  return function (target, key) {
    // 判断是否为 Reactive
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    // 收集依赖
    if (!isReadonly) {
      track(target, key);
    }
    // 获取目标对象的属性值
    const res = Reflect.get(target, key);
    if (isShallow) {
      return res;
    }
    // 处理对象嵌套问题
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    // 返回对应的数据
    return res;
  };
}

function createSetter() {
  return function (target, key, value) {
    // 1、设置对应的属性
    const res = Reflect.set(target, key, value);
    // 2、触发依赖更新
    trigger(target, key);
    // 3、返回是否设置成功
    return res;
  };
}

export const readonlyHandlers = {
  get: readonlyGet,
  set: function (target, key, value) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`
    );
    return true;
  },
};

export const shallowReadonlyHhandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
