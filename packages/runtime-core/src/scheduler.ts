const queue: any[] = []
let isFlushPending = false
const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>


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
    if (isFlushPending) return;
    isFlushPending = true;
    nextTick(flushJobs);
}

function flushJobs() {
    let job;
    isFlushPending = false;
    while ((job = queue.shift())) {
        console.log(job)
        job && job();
    }
}
