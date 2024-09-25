import { readonly, shallowRef } from "@mini-vue/reactivity";
import { getCurrentInstance } from "../component";
import { i } from "vitest/dist/reporters-yx5ZTtEV";
import { EMPTY_OBJ } from "@mini-vue/shared";


export function useTemplateRef(key: string) {
    const i = getCurrentInstance();
    const r = shallowRef(null)
    if (i) {
        const refs = i.refs === EMPTY_OBJ ? (i.refs = {}) : i.refs
        let desc;
        if ((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable) {
            console.warn(`useTemplateRef('${key}') already exists.`)
        } else {
            Object.defineProperty(refs, key, {
                enumerable: true,
                get: () => r.value,
                set: (val) => {
                    console.log(val)
                    return  val => (r.value = val)
                }
            })
        }
    }
    const ret = readonly(r);
    return ret
}