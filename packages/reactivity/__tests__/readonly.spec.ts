import { isReadonly, readonly, isProxy } from "../src/reactive";
import { vi } from "vitest";

describe("readonly", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    debugger
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
    expect(isProxy(wrapped)).toBe(true);
    expect(isProxy(original)).toBe(false);
  });

  it("should call console.warn when set", () => {
    console.warn = vi.fn();

    const user = readonly({
      age: 10,
    });
    user.age = 11;
    expect(console.warn).toHaveBeenCalled();
  });
});
