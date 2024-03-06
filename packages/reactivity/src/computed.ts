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
        this.dirty = true;
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
