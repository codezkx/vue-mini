import { extend } from "@/shared";

let activeEffect; // 获取当前effect实例对象
let shouldTrack; // 是否需要追踪

// 使用class存储当前的FN(依赖更新函数)
export class ReactiveEffect {
  public scheduler: Function | undefined;
  public deps: any[] = [];
  public onStop?: () => void;

  private _fn: () => any;
  private active: boolean = true;

  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  // 主要目的是更新依赖和收集依赖
  run() {
    // 当stop后不需要执行后续操作
    if (!this.active) {
      return this?._fn();
    }
    shouldTrack = true;
    activeEffect = this;
    const result = this?._fn();
    shouldTrack = false;
    return result;
  }

  // 这里注意调用stop的实例， 相当于删除对应的this
  stop() {
    // 处理多次执行stop的情况
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

// 清除当前实例所有的依赖
function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  // 初始化数据
  effect.deps.length = 0;
}

// 收集依赖
const targetMap = new Map();
export function track(target, key) {
  // 判断是否需要收集依赖
  if (!isTracking()) return false;
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
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  // 5、把当前的effect 添加到 dep中
  dep.add(activeEffect); // 这里连接收集依赖和触发依赖的关系
  // 6、实现stop 的清空依赖功能
  activeEffect.deps.push(dep);
}

export function isTracking() {
  // shouldTrack 是处理a++此等情况的（同时触发get 和 set）
  return activeEffect !== undefined && shouldTrack;
}

export function trigger(target, key) {
  // 核心点是如何触发依赖更新 执行ReactiveEffect类中的run 方法
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key);
  triggerEffects(deps);
}

export function triggerEffects(deps) {
  for (let dep of deps) {
    if (dep.scheduler) {
      dep.scheduler();
    } else {
      dep.run();
    }
  }
}

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
