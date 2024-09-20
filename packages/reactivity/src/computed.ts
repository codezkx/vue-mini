import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _getter: () => any;
  private _effect: ReactiveEffect;
  private _value: any;
  private dirty = true;

  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this.dirty) {
        this.dirty = true; // 当响应式属性更新数据时, 会执行这个函数 scheduler 方法. 重制dirty
      }
    });
  }

  get value() {
    
    if (this.dirty) {
      this._value = this._effect.run();
      this.dirty = false;
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
