import { extend } from "../../shared";

// 使用class存储当前的FN(依赖更新函数)
class ReactiveEffect {
  public scheduler: Function | undefined;
  public deps: any[] = [];
  public onStop?: () => void;

  private _fn: () => any;
  private active: boolean = true;

  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  // 主要目的时依赖收集
  run() {
    activeEffect = this;
    return this?._fn();
  }

  // 这里注意调用stop的实例， 相当于删除对应的this
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
}

// 收集依赖
const targetMap = new Map();
export function track(target, key) {
  // target(Map) -> key(Map) -> dep( Set 唯一)
  // 1、取出target的Map
  let depsMap = targetMap.get(target); // 取出key
  // 2、判断是否为空
  if (!depsMap) {
    // 2.1、为空则初始化Map
    depsMap = new Map(); // 第一次执行时没有对应的key value 则初始化
    // 2.2、存储对应的Map
    targetMap.set(target, depsMap);
  }
  // 3、利用key取出对应的Set
  let dep = depsMap.get(key); // 取出 dep的 Set
  // 4、判断Set是否为空
  if (!dep) {
    // 4.1、如果为空初始化Set
    dep = new Set();
    // 4.2、存储对应的Set
    depsMap.set(key, dep);
  }
  // 5、判断effect是否调用
  if (!activeEffect) return false;
  // 6、把当前的effect 添加到 dep中
  dep.add(activeEffect); // 这里连接收集依赖和触发依赖的关系
  // 7、实现stop 的清空依赖功能
  activeEffect.deps.push(dep);
}

export function trigger(target, key) {
  // 核心点是如何触发依赖更新 执行ReactiveEffect类中的run 方法
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key);
  for (let dep of deps) {
    if (dep.scheduler) {
      dep.scheduler();
    } else {
      dep.run();
    }
  }
}

let activeEffect; // 获取当前effect实例对象
// 每执行有一次effect就会创建一个fn的实例
export function effect(fn, options: any = {}) {
  // 存储当前的fn
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  extend(_effect, options);
  const runner: any = _effect.run.bind(_effect);
  // JS中函数本质也是一个对象
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  // 删除 effect 对应的fn实例
  runner.effect.stop();
}
