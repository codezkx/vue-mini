import { isFunction } from "@mini-vue/shared";
import { getCurrentInstance } from "./component";
export function provide(key, value) {
    const currentInstance: any = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            // 指向原型指向父级
            provides = currentInstance.provides = Object.create(parentProvides)
        }
        provides[key] = value;
    }
}

export function inject(key, defalutValue) {
    const currentInstance: any = getCurrentInstance();
    if (currentInstance) {
        // 获取到的就是父级上的provides  这样获取会导致中间层级的数据变化(key相同时)
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        } else {
            // 设置默认值
            if (isFunction(defalutValue)) {
                return defalutValue()
            } else {
                return defalutValue
            }
        }
    }
}