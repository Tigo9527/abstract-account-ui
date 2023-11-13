export function isCallException(obj:{code: string}) {
    return obj?.code == 'CALL_EXCEPTION';
}

export function formatCallException(obj: any) {
    return `${obj.code || obj.message || obj}`
}


export function mergeV<T>(old: Partial<T>, props: Partial<T>) {
    return {...old, ...props}
}

export function convertStatus600(e: any) {
    if (e.status === 600) {
        return JSON.parse(e.body)
    }
    throw e;
}