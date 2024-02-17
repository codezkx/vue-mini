import { h } from "../../lib/guide-mini-vue.esm.js";

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
      "hi," + this.msg
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-Vue3")]
    );
  },

  setup() {
    return {
      msg: "mini-vue3",
    };
  },
};
