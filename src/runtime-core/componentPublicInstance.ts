import { hasOwn } from "@/shared/index";

const publicPropertiesMap = {
  // 当用户调用 instance.proxy.$emit 时就会触发这个函数
  // i 就是 instance 的缩写 也就是组件实例对象
  $el: (i) => i.vnode.el,
  $emit: (i) => i.emit,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 思想是在render中访问setup中的一个属性时可以取出
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      // 在render函数中访问到setup中返回的属性
      return setupState[key];
    } else if (hasOwn(props, key)) {
      // 在render函数中访问到setup中的props对象中的属性
      return props[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
