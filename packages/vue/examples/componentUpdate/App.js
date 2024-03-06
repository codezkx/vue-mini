// 在 render 中使用 proxy 调用 emit 函数
// 也可以直接使用 this
// 验证 proxy 的实现逻辑
import { h, ref } from "../../dist/mini-vue.esm-bundler.js";
import Child from "./Child.js";

export default {
  name: "App",
  setup() {
    const msg = ref("123");
    window.msg = msg
    const count = ref(0)

    const changeChildProps = () => {
      msg.value = "456";
    };
    const addCount = () => {
      count.value++
    };

    return { msg, changeChildProps, addCount, count };
  },

  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h(
        "button",
        {
          onClick: this.changeChildProps,
        },
        "change child props"
      ),
      h(Child, {
        msg: this.msg,
      }),
      h(
        "button",
        {
          onClick: this.addCount,
        },
        "addCount"
      ),
      h("div", {}, "count: " + this.count),
    ]);
  },
};