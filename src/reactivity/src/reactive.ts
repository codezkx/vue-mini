import { mutableHandler, readonlyHandlers } from "./baseHandlers";

export function reactive(row) {
  return createActiveObject(row, mutableHandler);
}

export function readonly(row) {
  return createActiveObject(row, readonlyHandlers);
}

function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
