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
    };
    return vnode;
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
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
    patch(vnode);
}
/**
 * @description 基于vnode的类型进行不同类型的组件处理  patch(主要是用于递归渲染节点)
 *
 */
function patch(vnode, container) {
    if (typeof vnode.type === "object") {
        processComponent(vnode);
    }
    else if (typeof vnode.type === "string") ;
}
/**
 * @description 处理组件类型
 *
 * **/
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    // 初始组件属性
    setupComponent(instance);
    // 处理render函数
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, vnode, container) {
    const subTree = instance.render();
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        // 初始化
        mount(rootContainer) {
            // vue创建虚拟节点（对应虚拟DOM）
            const vnode = createVnode(rootComponent);
            render(vnode);
        },
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

export { createApp, h };
