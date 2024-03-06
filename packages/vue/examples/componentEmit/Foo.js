import { h } from "../../dist/mini-vue.esm-bundler.js";

export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("add emit");
      // emit("add");
      emit("add-foo", 1, 2);
    };
    return {
      msg: "Foo",
      emitAdd,
    };
  },
  render() {
    // 测试事件注册
    // return h(
    //   "div",
    //   {
    //     onClick() {
    //       console.log("clicked");
    //     },
    //   },
    //   "count: " + this.count
    // );
    // 测试emit
    const btn = h("button", { onClick: this.emitAdd }, "emitAdd");
    const foo = h("div", {}, "foo " + this.msg);
    return h("div", {}, [foo, btn]);
  },
};
