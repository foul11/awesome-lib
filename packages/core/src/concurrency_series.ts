import { Sema } from 'async-sema';

// Если не использовать этот тип, а какие нибудь never или unknown, то проверки по какой то не ведомой причине перестают нормально работать
type EmptyType = '__/__TYPE_EMPTY_VALUE__/__';

export async function concurrency_series<
    Task,
    Result extends
        | (SerialResult extends EmptyType
            ? TaskResult
            : SerialResult)
        | ErrorResult,
    Return extends
        NoSettled extends true
            ? Awaited<Result>[]
            : PromiseSettledResult<Awaited<Result>>[],
    TaskResult = EmptyType,
    SerialResult = EmptyType,
    ErrorResult = never,
    NoSettled extends boolean = false,
>(
    concurrency: number,
    task_list: Task[],
    callback: (task: Task) => Promise<TaskResult>,
    options?: {
        on_complete_serial?: ((task_result: TaskResult) => Promise<SerialResult>)
        on_failed_task?: ((error: any) => Promise<ErrorResult>)
        noSettled?: NoSettled
    },
): Promise<Return> {
    const sem = new Sema(concurrency, { capacity: task_list.length });
    const results: Promise<Result>[] = [];
    let last_promise: Promise<any> = Promise.resolve();
    
    for (const task of task_list) {
        await sem.acquire();
        
        const task_promise = (async (task_result_promise: Promise<TaskResult>, last_promise_arg: Promise<any>): Promise<Result> => {
            if (options?.on_complete_serial === undefined) {
                const task_result = await task_result_promise;
                
                sem.release();
                return task_result as any;
            }
            
            await last_promise_arg;
            
            const task_result = await task_result_promise;
            const serial_result = await options.on_complete_serial(task_result);
            
            sem.release();
            return serial_result as any;
        })(callback(task), last_promise)
            .catch(async (error): Promise<Result> => {
                if (options?.on_failed_task) {
                    return options.on_failed_task(error) as any;
                }
                
                throw error;
            });
        
        results.push(task_promise);
        last_promise = task_promise;
    }
    
    if (options?.noSettled) {
        return Promise.all(results) as any;
    } else {
        return Promise.allSettled(results) as any;
    }
}
