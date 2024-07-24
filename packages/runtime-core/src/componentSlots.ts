/* 
   思路: 获取父组件的当前组件传入下来的children, 然后渲染到自组件的对应位置  
    1、获取当前组件的children
    2、判断children是否是slots
      1、首先判断是否为组件
      2、组件是否有children
    3、通过当前组件实例的slots,然后把children赋值给slots.
    4、如果slots是一个数组则需要转化成对应的vnode(利用renderSlots) 
    5、把不是数组形式格式转化成数组格式
    
    6、命名插槽
      1、需要传入一个对象, 需要根据提供的key取出value 
      2、判断是否为数组.

    7、作用域插槽
      1、需要把插槽转化成函数, 把对应的参数通过对象形式传入
      2、渲染插槽时如果传入的不是一个函数则不进行渲染
*/
import { isArray, isFunction, ShapeFlags } from "@mini-vue/shared";

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

// 处理具名插槽  实现key value形式.
function normalizeObjectSlots(children, slots) {
  for (let key in children) {
    const value = children[key]
    if (isFunction(value)) {
      slots[key] = (props) => normalizeSlotValue(value(props))
    }
  }
}

function normalizeSlotValue(value) {
  return isArray(value) ? value : [value] 
}
