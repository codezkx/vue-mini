const reNumber = /^[-+]?(((0|[1-9]\d*)?\.\d+)|(([1-9]\d*)\.)|(0|[1-9]\d*))$/

export const extend = Object.assign;

export const EMPTY_OBJ = {}

export function hasChanged(value, odlValue) {
  return !Object.is(value, odlValue);
}

export const isOn = (val: string): boolean => /^on[A-Z]/.test(val);

const hasOwnProperty = Object.prototype.hasOwnProperty

export const hasOwn = (
    val: object,
    key: string | symbol,
  ): key is keyof typeof val => hasOwnProperty.call(val, key);
  
  /**
   * @description
   *
   * @example
   *  toNumber('1n') => 1
   *  toNumber('n1') => 'n1'
   * **/
  export const toNumber = (val: any): any => {
    const n = parseFloat(val);
    return isNaN(n) ? val : n;
  };
  
  export const isArray = Array.isArray;
  
  export const oKeys = Object.keys
  
  const objectToString = Object.prototype.toString;
  export const toTypeString = (val: unknown): string =>
    objectToString.call(val);
  
  export const isMap = (val: unknown): val is Map<any, any> =>
    toTypeString(val) === '[object Map]';
  
  export const isSet = (val: unknown): val is Set<any> =>
    toTypeString(val) === '[object Set]';
  
  export const isDete = (val: unknown): val is Date =>
    toTypeString(val) === '[object Date]';
  
  export const isFunction = (val: unknown): val is Function =>
    toTypeString(val) === '[object Function]';
  
  export const isString = (val: unknown): val is string =>
    typeof val === 'string';
  
  export const isNumber = (val: string): boolean =>
   reNumber.test(val)
  
  export const isBoolean = (val: unknown): val is boolean =>
    typeof val === 'boolean';
  
  export const isSymbol = (val: unknown): val is symbol =>
    typeof val === 'symbol';
  
  export const isObject = (val: unknown): val is Record<any, any> =>
    val !== null && typeof val === 'object';
  
  export const isEmptyObject = (val: unknown): val is Record<any, any> =>
    JSON.stringify(val) === '{}'
  
  export const isUnDef = <T = unknown>(val: T): val is T => !isDef(val);
  
  export const isDef = <T = unknown>(val: T): val is T =>
    typeof val !== 'undefined';
  
  export const isNull = <T = unknown>(val: T): val is T => val === null;
  
  export const isNullOrUnDef = (val: unknown): val is null | undefined =>
    isUnDef(val) || isNull(val);
  
  export const isNullAndUnDef = (val: unknown): val is null | undefined =>
    isUnDef(val) && isNull(val);
  
  export const isUndefined = (val: unknown): val is undefined =>
    typeof val === 'undefined'
  
  export const isElement = (e: unknown): e is Element => {
    if (isUndefined(e)) return false;
    return e instanceof Element;
  }
  
  export const realArray = (val: unknown[]): boolean => {
    if (!isArray(val)) return false;
    return val.length > 0;
  }
  
  export const isEmptyArray = (val: unknown): val is boolean => {
    if (!isArray(val)) return false
    return val.length === 0
  }
  
  export const isAllEmpty = (val: unknown): val is boolean => {
    if (isNullOrUnDef(val) || val === '') return true;
    if (isEmptyArray(val)) return true;
    if (isEmptyObject(val)) return true;
    if (isMap(val) && val.size === 0) return true;
    if (isSet(val) && val.size === 0) return true;
    return false
  }
  
  export const isUrl = (val: unknown): val is boolean => { 
    try {
      new URL(val as string)
      return true;
    } catch (_) {
      return false;
    }
  }
