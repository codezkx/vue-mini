const queue: any[] = []
let isFlushPending = false
const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>
const activePreFlushCbs: any = [];

export function nextTick(fn?) {
    // 返回一个微任务 使其在同步代码后执行
    return fn ? resolvedPromise.then(fn) : resolvedPromise;
}

/* 
    把视图更新优化成异步任务
*/
export function queueJob(job) {
    // 不存在则不添加   但是当前执行这里job一直是相同值, 
    if (!queue.includes(job)) {
        queue.push(job)
    }
    queueFlush()
}

function queueFlush() {
    // 如果同时触发了两个组件的更新的话
    // 这里就会触发两次 then （微任务逻辑）
    // 但是着是没有必要的
    // 我们只需要触发一次即可处理完所有的 job 调用
    // 所以需要判断一下 如果已经触发过 nextTick 了
    // 那么后面就不需要再次触发一次 nextTick 逻辑了
    if (isFlushPending) return;
    isFlushPending = true;
    nextTick(flushJobs);
}

export function queuePreFlushCb(cb) {
    queueCb(cb, activePreFlushCbs);


function queueCb(cb, activeQueue) {
    // 直接添加到对应的列表内就ok
    // todo 这里没有考虑 activeQueue 是否已经存在 cb 的情况
    // 然后在执行 flushJobs 的时候就可以调用 activeQueue 了
    if (!activeQueue.includes(cb)) {
        activeQueue.push(cb);
    }
    // 然后执行队列里面所有的 job
    queueFlush()
}}

function flushJobs() {
    isFlushPending = false;

    // 先执行 pre 类型的 job
    // 所以这里执行的job 是在渲染前的
    // 也就意味着执行这里的 job 的时候 页面还没有渲染
    flushPreFlushCbs();

    let job;
    while ((job = queue.shift())) {
        console.log(job)
        job && job();
    }
}

function flushPreFlushCbs() {
    // 执行所有的 pre 类型的 job
    for (let i = 0; i < activePreFlushCbs.length; i++) {
      activePreFlushCbs[i]();
    }
}
