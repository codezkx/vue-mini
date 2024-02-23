import { h, ref, reactive, nextTick, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";
import NextTicker from "./NextTicker.js";

export default {
  name: "App",
  setup() {
    const count = ref(0);
    const i = getCurrentInstance()
    const addCount = async () => {
      for (let i = 0; i <  50; i++) {
        count.value = i
      }
      // 测试nextTick功能
      console.log(i)
      nextTick(() => {
       console.log(i)
      })
      
    }
    return {
      addCount,
      count,
    }

  },

  render() {
    return h("div", { tId: 1 }, [
      h(
        "button",
        {
          onClick: this.addCount,
        },
        "addCount"
    ),h("p", { onClick: this.addCount }, "count:" + this.count)]);
    // , h(NextTicker)
  },
};
