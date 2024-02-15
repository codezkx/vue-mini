export const extend = Object.assign;

export const isObject = (val: unknown): val is boolean => {
  return val !== null && typeof val === "object";
};
