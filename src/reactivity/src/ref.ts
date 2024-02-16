import { hasChanged, isObject } from "../../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

/* 
  1、proxy 只针对对象类型 基础类型不进行代理
  2、那ref需要进行对象包括（针对基础类型）
  3、利用对应的get set 方法触发依赖的收集与触发
*/
class RefImpl {
  private _value: any;
  private _rawValue: any;

  private dep: Set<unknown>;
  constructor(value) {
    // 存储最初的值
    this._rawValue = value;
    // 把嵌套对象（如果是对象的话）设置称响应式对应
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
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
  return new RefImpl(value);
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
