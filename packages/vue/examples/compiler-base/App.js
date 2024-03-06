// template 包含 element 和 interpolation 
export default {
  template: `<p>hi,{{msg}}</p>`,
  setup() {
    return {
      msg: "vue3 - compiler",
    };
  },
};
