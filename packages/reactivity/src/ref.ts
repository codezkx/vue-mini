import { hasChanged, isArray, isFunction, isObject } from "@mini-vue/shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { isProxy, isReactive, reactive } from "./reactive";
import { ReactiveFlags } from "./constants";

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
  constructor(value, isShallow?: boolean) {
    // 存储最初的值
    this._rawValue = value;
    // 把嵌套对象（如果是对象的话）设置称响应式对应
    this._value = isShallow ? value : convert(value);
    this[ReactiveFlags.IS_SHALLOW] = isShallow;
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

class GetterRefImpl<T> {
  public readonly [ReactiveFlags.IS_REF] = true;
  public readonly [ReactiveFlags.IS_READONLY] = true;

  private _value: T = undefined!;

  constructor(private readonly _getter: () => T) {}

  get value() {
    return (this._value = this._getter());
  }
}

class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly [ReactiveFlags.IS_REF] = true;
  public _value: T[K] = undefined!;

  constructor(
    private readonly _object: T,
    private readonly _key: K,
    private readonly _defaultValue?: T[K]
  ) {}

  get value() {
    // 如何 _object 是响应式对象则可以触发响应式更新
    const val = this._object[this._key];
    return (this._value = val === undefined ? this._defaultValue! : val);
  }

  set value(newVal) {
    this._object[this._key] = newVal;
  }

  // get dep(): Dep | undefined {
  //   return getDepFromReactive(toRaw(this._object), this._key)
  // }
}

function trackRefValue(ref) {
  // 当初始化时activeEffect是为undefined 所以需要判断是否为空
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  if (isRef(value)) {
    return value;
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

export function toRef(source, key, defaultValue) {
  // 1. 判断source是否为ref
  if (isRef(source)) {
    return source;
  }
  // 2. 判断source是否为函数, 则创建一个只读的getter
  else if (isFunction(source)) {
    return new GetterRefImpl(source);
  }
  // 3. 判断source是否为对象, 且参数大于1
  else if (isObject(source) && arguments.length > 1) {
    return propertyToRef(source, key, defaultValue);
  }
  // 4. 如果以上都不是则使用 ref 转为响应式对象
  else {
    return ref(source);
  }
}

function propertyToRef(
  source: Record<string, any>,
  key: string,
  defaultValue?: unknown
) {
  const val = source[key];
  return isRef(val)
    ? val
    : (new ObjectRefImpl(source, key, defaultValue) as any);
}

// 将ref对象转成源对象, source是函数就返回其返回值
export function toValue(source) {
  return isFunction(source) ? source() : unRef(source);
}

export function toRefs(source) {
  if (isProxy(source)) {
    console.warn(
      `[Vue warn]: toRefs() expects a reactive object but received a plain one.`
    );
  }
  const result = isArray(source) ? new Array(source.length) : {};
  for (const key in source) {
    result[key] = propertyToRef(source, key);
  }
  return result;
}

//  的浅层作用形式。
export function shallowRef(value) {
  return createRef(value, true);
}

function createRef(rawValue, shallow) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

export function triggerRef(ref) {}

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
