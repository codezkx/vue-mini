import { h, createTextVNode, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";


export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    // 默认插槽
    // const foo = h(Foo, {}, { default: () => h("p", {}, "123") });
    // 具名插槽
    // const foo = h(Foo, {}, {
    //   header: h("p", {}, "header"), 
    //   footer: h("p", {}, "footer")
    // });
    // 作用域插槽
    // const foo = h(Foo, {}, {
    //   header: ({age}) => [h("p", {}, "header" + age), createTextVNode('纯文本节点')], 
    //   footer: () => h("p", {}, "footer")
    // });
    return h("div", {}, [app]);
  },

  setup() {
    console.log(getCurrentInstance())
    return {
      msg: "mini-vue3",
    };
  },
};
