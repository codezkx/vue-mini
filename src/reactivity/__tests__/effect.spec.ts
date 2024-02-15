import { reactive } from "../src/reactive";
import { effect, stop } from "../src/effect";

describe("effect", () => {
  // 测试effect更新依赖
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  // 测试effect函数返回值   effect(fn) -> function(runner) -> fn ->  effect 的return值
  it("runner", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });

  /* 
    1、通过effect的第二个参数给定的一个scheduler的fn
    2、effect 第一次执行的时候 还会执行 fn
    3、当 响应式对象 set update 不会执行fn  而是执行scheduler
    4、如果执行当前执行runner 的时候， 会再次的执行fn
  
  */
  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });

    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    // toHaveBeenCalled 确保函数执行  前面加个not就是反之的意思
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    obj.foo++;
    // toHaveBeenCalledTimes  函数执行的多少次
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);
    run();
    expect(dummy).toBe(2);
  });

  /*
    当执行stop后 依赖停止更新， 再次执行effect后在执行更新动作更新正常
      （需要注意的时effect执行后都会创建一个class）

   */
  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3; 这里只会执行set
    /* 
      1、get 操作时是不希望执行依赖收集操作的
      2、set 时不希望依赖更新
    
    */
    obj.prop++; // 这里的测试是有问题的， 这里会执行get 和 set
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );
    stop(runner);
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
