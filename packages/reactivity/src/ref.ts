import { hasChanged, isObject } from "@mini-vue/shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { isReactive, reactive } from "./reactive";

/* 
  1、proxy 只针对对象类型 基础类型不进行代理
  2、那ref需要进行对象包括（针对基础类型）
  3、利用对应的get set 方法触发依赖的收集与触发  
   implement
*/
class RefImpl {
  private _value: any;
  private _rawValue: any;
  private dep: Set<unknown>;

  public __v_isRef: boolean = true;
  constructor(value) {
    // 存储最初的值
    this._rawValue = value;
    // 把嵌套对象（如果是对象的话）设置称响应式对应
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    return this._value;
  }

  // 更新对应依赖
  set value(value) {
    //当value与原来的value 相等时不需要更新_value
    if (hasChanged(value, this._rawValue)) {
      this._value = value;
      this._rawValue = value;
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  // 当初始化时activeEffect是为undefined 所以需要判断是否为空
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  if (isRef(value)) {
    return value
  }
  return new RefImpl(value);
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isRef(value) {
  return !!value.__v_isRef;
}

export function unRef(value) {
  return isRef(value) ? value.value : value;
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get: (target, key, receiver) => unRef(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
};

// 实现在模板访问ref时不需要.value 此方法就是解构的方法
export function proxyRefs(objectWithRefs) {
  /* 
    为什么使用代理？
      因为需要在获取和设置时需要触发get 和 set  又因为objectWithRefs是对象
      所以使用proxy  （如果不是对象需要特别处理， 这里就不做处理了）
  */
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
