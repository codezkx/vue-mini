// 处理 add-foo => addFoo 情况
export const camelize = (str: string) => {
  return str
    ? str.replace(/-(\w)/g, ($0, $1) => {
        return $1.toUpperCase();
      })
    : "";
};

// add -> Add
export const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

export const toHandlerKey = (str: string) =>
  str ? "on" + capitalize(str) : "";
