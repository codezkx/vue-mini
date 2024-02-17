import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  setup(props) {
    console.log(props, "props1");
    props.count++;
    console.log(props, "props2");
    return {
      msg: "Foo",
    };
  },
  render() {
    return h(
      "div",
      {
        onClick() {
          console.log("clicked");
        },
      },
      "count: " + this.count
    );
  },
};
