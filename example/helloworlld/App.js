import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";
window.self = null;
export const App = {
  render() {
    // 测试$el
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "blue"],
        onClick() {
          console.log("clicked");
        },
      },
      [
        h("div", {}, "hi," + this.msg),
        h(Foo, {
          count: 1,
          // onAdd() {
          //   console.log("on add");
          // },
          onAddFoo(a, b) {
            console.log("on Add Foo", a, b);
          },
        }),
      ]
    );
  },

  setup() {
    return {
      msg: "mini-vue3",
    };
  },
};
