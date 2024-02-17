export const extend = Object.assign;

export const isObject = (val: unknown): val is boolean => {
  return val !== null && typeof val === "object";
};

export function hasChanged(value, odlValue) {
  return !Object.is(value, odlValue);
}

export const isOn = (val: string): boolean => /^on[A-Z]/.test(val);

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);
