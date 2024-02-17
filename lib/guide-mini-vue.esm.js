/**
 * @param type Object | string
 * @param props 节点属性
 * @param children 子节点
 * @description 创建一个虚拟节点   后面两个参数是在h函数调用时
 */
function createVnode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlag(type), // 元素类型标识
        el: null,
    };
    // 判断children是什么类型
    if (typeof children === "string") {
        vnode.shapeFlags |= 8 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 16 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 4 /* ShapeFlags.STATEFUL_COMPONENT */;
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isOn = (val) => /^on[A-Z]/.test(val);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

// 处理 add-foo => addFoo 情况
const camelize = (str) => {
    return str
        ? str.replace(/-(\w)/g, ($0, $1) => {
            return $1.toUpperCase();
        })
        : "";
};
// add -> Add
const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
const toHandlerKey = (str) => str ? "on" + capitalize(str) : "";

// 收集依赖
const targetMap = new Map();
function trigger(target, key) {
    // 核心点是如何触发依赖更新 执行ReactiveEffect类中的run 方法
    const depsMap = targetMap.get(target);
    const deps = depsMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    for (let dep of deps) {
        if (dep.scheduler) {
            dep.scheduler();
        }
        else {
            dep.run();
        }
    }
}

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["SKIP"] = "__v_skip";
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_SHALLOW"] = "__v_isShallow";
    ReactiveFlags["RAW"] = "__v_raw";
})(ReactiveFlags || (ReactiveFlags = {}));

/*
  优化点 当get执行时不需要每次调用createGetter或者createSetter，所以只需要模块引用时执行一次即可(利用缓存技术)
*/
const get = createGetter(false);
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandler = { get, set };
function createGetter(isReadonly = false, isShallow = false) {
    return function (target, key) {
        // 判断是否为 Reactive
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        // 获取目标对象的属性值
        const res = Reflect.get(target, key);
        if (isShallow) {
            return res;
        }
        // 处理对象嵌套问题
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 返回对应的数据
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        // 1、设置对应的属性
        const res = Reflect.set(target, key, value);
        // 2、触发依赖更新
        trigger(target, key);
        // 3、返回是否设置成功
        return res;
    };
}
const readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key, value) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`);
        return true;
    },
};
const shallowReadonlyHhandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(row) {
    return createActiveObject(row, mutableHandler);
}
function readonly(row) {
    return createActiveObject(row, readonlyHandlers);
}
function shallowReadonly(row) {
    return createActiveObject(row, shallowReadonlyHhandlers);
}
function createActiveObject(target, baseHandlers) {
    if (!target) {
        console.warn(`target ${target} 必须是一个对象`);
    }
    return new Proxy(target, baseHandlers);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    // 当用户调用 instance.proxy.$emit 时就会触发这个函数
    // i 就是 instance 的缩写 也就是组件实例对象
    $el: (i) => i.vnode.el,
    // $emit: (i) => i.emit,
    // $slots: (i) => i.slots,
    // $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 思想是在render中访问setup中的一个属性时可以取出
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            // 在render函数中访问到setup中返回的属性
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            // 在render函数中访问到setup中的props对象中的属性
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function emit(instance, event, ...args) {
    const { props } = instance;
    // 获取事件名规范模式 如 foo -> onFoo | add-foo -> onAddFoo
    const handlerName = toHandlerKey(camelize(event));
    // 获取事件的事件处理程序
    const handler = props[handlerName];
    handler && handler(...args);
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
    };
    // 把组件实例传递给emit第一个参数， 这样用户就不需要传入组件实例了
    component.emit = emit.bind(null, component);
    return component;
}
// 初始对应的props、slot、setup
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // initSlots();
    setupStatefulComponent(instance);
}
// 获取setup返回值
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 创建一个代理对象
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        /**
         * @description 注意这里可能返回一个函数或者一个对象
         * @returns {
         *    function: 是一个渲染函数（render）
         *    Object：需要把此对象注入到instance的上下文中不然rander函数不能通过this访问到setup中返回的数据
         * }
         */
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
    }
}
// 处理setup中返回的类型 function(就是渲染函数) | object（需要通过渲染函数）
function handleSetupResult(instance, setupResult) {
    // todo Function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
// 确保实例对象上有render函数
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

/**
 * @param vnode 节点
 * @param container App组件实例
 *
 *
 */
function render(vnode, container) {
    patch(vnode, container);
}
/**
 * @description 基于vnode的类型进行不同类型的组件处理  patch(主要是用于递归渲染节点)
 *
 */
function patch(vnode, container) {
    const { shapeFlags } = vnode;
    if (shapeFlags & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
    else if (shapeFlags & 1 /* ShapeFlags.ELEMENT */) {
        proceessElement(vnode, container);
    }
}
/**
 * @description 处理组件类型
 *
 * **/
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    // 初始组件属性
    setupComponent(instance);
    // 处理render函数
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    // 把代理对象绑定到render中
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // 获取当前的组件实例根节点
    vnode.el = subTree.el;
}
// 处理元素
function proceessElement(vnode, container) {
    mountElement(vnode, container);
}
// 经过上面的处理确定vnode.type是element string类型
function mountElement(vnode, container) {
    // 创建对应的元素节点
    const el = (vnode.el = document.createElement(vnode.type));
    const { children, props } = vnode;
    const { shapeFlags } = vnode;
    // 判断是否有children，如果那么判断是字符串还是数据
    if (children) {
        if (shapeFlags & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(children, el);
        }
    }
    // 设置对应的props
    if (props) {
        for (let prop in props) {
            // 判断是否为继承
            if (!props.hasOwnProperty(prop))
                return;
            if (isOn(prop)) {
                const event = prop.slice(2).toLowerCase();
                el.addEventListener(event, props[prop]);
            }
            const val = props[prop];
            el.setAttribute(prop, val);
        }
    }
    // 添加到对应的容器上
    container.append(el);
}
/**
 *
 *@description 递归处理children
 *
 */
function mountChildren(children, el) {
    children.forEach((vnode) => {
        patch(vnode, el);
    });
}

function createApp(rootComponent) {
    return {
        // 初始化
        mount(rootContainer) {
            // vue创建虚拟节点（对应虚拟DOM）
            const vnode = createVnode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

export { createApp, h };
