import { h, renderSlots, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    console.log(getCurrentInstance())

    return {
      msg: "Foo",
    };
  },
  render() {
    const foo = h("p", {}, "Foo")
    const age = 18;
    // return h("div", {}, [renderSlots(this.$slots, 'default', {age})] )
    // return h("div", {}, [renderSlots(this.$slots, 'default', {age})] )

    return h("div", {}, [renderSlots(this.$slots, 'header', {age}), foo, renderSlots(this.$slots, 'footer', {age})]);
  },
};
