import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";


export const App = {
  render() {
    const app = h("div", {}, "App");
    // 默认插槽
    const foo = h(Foo, {}, { default: () => h("p", {}, "123") });
    // 具名插槽
    // const foo = h(Foo, {}, {
    //   header: h("p", {}, "header"), 
    //   footer: h("p", {}, "footer")
    // });
    // 作用域插槽
    // const foo = h(Foo, {}, {
    //   header: ({age}) => h("p", {}, "header" + age), 
    //   footer: () => h("p", {}, "footer")
    // });
    return h("div", {}, [app, foo]);
  },

  setup() {
    return {
      msg: "mini-vue3",
    };
  },
};
