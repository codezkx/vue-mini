import { camelize, toHandlerKey } from "@/shared/index";

export function emit(instance, event, ...args) {
  const { props } = instance;
  // 获取事件名规范模式 如 foo -> onFoo | add-foo -> onAddFoo
  const handlerName = toHandlerKey(camelize(event));
  // 获取事件的事件处理程序
  const handler = props[handlerName];
  handler && handler(...args);
}
