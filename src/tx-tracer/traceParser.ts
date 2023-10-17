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
const log = (...args)=>{}
export function buildTree(arr: ITrace[]): ITrace {
    const parentQueue: ITrace[] = []
    let idx = 0;
    arr.forEach((v, idx)=>{
        v.id=idx; v.children = undefined;
        v.key = idx;
    });
    do {
        let cur = arr[idx++];
        log(`idx ${cur.id}, from ${cur.action.from.substring(0, 6)} to ${cur.action.to?.substring(0,6)}, sub ${cur.subtraces}`)
        if (cur.subtraces > 0) {
            log(`push cur and continue`)
            parentQueue.push(cur)
            continue
        }
        do {
            const parent = parentQueue.pop();
            if (!parent) {
                log(`no parent`)
                break
            }
            log(`pop a parent ${parent.id}, sub ${parent.subtraces}`);
            if (!parent.children) {
                log(`init children`);
                parent.children = [];
            }
            parent.children.push(cur)
            if (parent.children.length < parent.subtraces) {
                parentQueue.push(parent)
                log(`not full ${parent.children.length} < ${parent.subtraces}`)
                break // continue filling this parent
            }
            log(`${parent.id} is full, ${parent.children.length} vs ${parent.subtraces}`)
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

function parseCall() {

}