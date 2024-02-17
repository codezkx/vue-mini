import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["red", "blue"],
      },
      "hi," + this.msg
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-Vue3")]
    );
  },

  setup() {
    return {
      msg: "vue3",
    };
  },
};
