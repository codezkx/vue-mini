import { track, trigger } from "../src/effect";

export function reactive(row) {
  return new Proxy(row, {
    get(target, key) {
      // 1、获取目标对象的属性值
      const res = Reflect.get(target, key);
      // 2、收集依赖
      track(target, key);
      // 3、返回对应的数据
      return res;
    },
    set(target, key, value): any {
      // 1、设置对应的属性
      const res = Reflect.set(target, key, value);
      // 2、触发依赖更新
      trigger(target, key);
      // 3、返回是否设置成功
      return res;
    },
  });
}
