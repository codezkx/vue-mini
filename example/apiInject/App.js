// 组件 provide 和 inject 功能
import {
  h,
  provide,
  inject,
} from "../../lib/guide-mini-vue.esm.js";

const ProviderOne = {
  name: "ProviderOne",
  setup() {
    provide("foo", "foo1");
    provide("bar", "bar2");
    return {
      
    }
  },
  render() {
    return h(ProviderTwo)
  }
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    // override parent value
    provide("foo", "fooOverride");
    // provide("baz", "baz");
    const foo = inject("foo");
    // console.log(foo, 'foo')
    // 这里获取的 foo 的值应该是 "foo"
    // 这个组件的子组件获取的 foo ，才应该是 fooOverride
    // if (foo !== "foo") {
    //   throw new Error("Foo should equal to foo");
    // }
    return {
      foo
    }
  },
  render() {
    return  h('div', {}, [h("div", {}, `ProviderTwo -${this.foo}`), h(Consumer)])
  }
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz = inject("baz", "默认值");
    return {
      foo,
      bar,
      baz
    }
  },
  render() {
    // return h("div", {}, `Consumer -${this.foo}-${this.bar}`);
      return h("div", {}, `Consumer -${this.foo}-${this.bar}-${this.baz}`);
  }
};

export default {
  name: "App",
  setup() {
    
  },
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(ProviderOne)])
  }
};
