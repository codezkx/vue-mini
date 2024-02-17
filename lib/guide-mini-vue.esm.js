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
        const setupState = instance.setupState;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}
// 初始对应的props、slot、setup
function setupComponent(instance) {
    // initProps()
    // initSlots
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
        const setupResult = setup();
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
