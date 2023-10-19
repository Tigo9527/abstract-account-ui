export interface ITrace {
    action: {
        init: string | undefined;
        callType: string, from: string, gas: string, input: string, to: string, value: string,
        createType?:string
    },
    result: {
        address: string;
        gasUsed: string, output: string,
    },
    error?:string,
    subtraces: number,
    type: string,
    valid: boolean,
    children?: ITrace[]
    id: number
    key?: number
    depthPrefix?: string
    abi?: string
}
// const log = console.log
export function buildTree(arr: ITrace[]): ITrace {
    const parentQueue: ITrace[] = []
    let idx = 0;
    arr.forEach((v, idx)=>{
        v.id=idx; v.children = undefined;
        v.key = idx;
    });
    do {
        let cur = arr[idx++];
        if (cur.subtraces > 0) {
            parentQueue.push(cur)
            continue
        }
        do {
            const parent = parentQueue.pop();
            if (!parent) {
                break
            }
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(cur)
            if (parent.children.length < parent.subtraces) {
                parentQueue.push(parent)
                break // continue filling this parent
            }
            cur = parent
        } while(parentQueue.length)
    } while (idx<arr.length)
    arr[0].depthPrefix = '0'
    fillPrefix(arr[0])
    return arr[0];
}

function fillPrefix(parent:ITrace) {
    parent.children?.forEach((e, idx)=>{
        e.depthPrefix = parent.depthPrefix + '_' + idx
        fillPrefix(e)
    })
}