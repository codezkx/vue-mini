import { h, ref, reactive } from "../../lib/guide-mini-vue.esm.js";
export default {
  name: "Child",
  setup(props, { emit }) {
    return {}
  },
  render(proxy) {
    return h("div", {}, [
      h("div", {}, "child" + this.$props.msg)
    ]);
  },
};
