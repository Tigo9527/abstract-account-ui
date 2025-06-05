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
    traceAddress?: number[]
}
// const log = console.log
// see https://openethereum.github.io/JSONRPC-trace-module#trace_transaction
export function buildTreeEther(arr: ITrace[]): ITrace {
    const [parent, ...rest] = arr;
    parent.children = [];
    function findParent(traceAddress: number[], t: ITrace) {
        console.log('traceAddress', traceAddress, ' of ', t.id);
        let p = parent;
        for (let i = 0; i < traceAddress.length - 1; i++) {
            p = p.children![traceAddress[i]];
            console.log(`set parent to `, p.id)
        }
        if (!p.children) {
            p.children = [];
        }
        p.children.push(t);
        console.log(`push child ${t.id} to parent ${p.id}`);
    }

    console.log(`rest length`, rest.length);
    for (let i = 0; i < rest.length; i++){
        console.log(`process index `, i);
        const t = rest[i];
        try {
            findParent(t.traceAddress!, t);
        } catch (e) {
            console.log(`error while process index `, i, e);
        }
    }
    console.log('done', parent)
    return parent;
}
let useEtherTree = true;
export function buildTree(arr: ITrace[]): ITrace {
    const parentQueue: ITrace[] = [];
    let idx = 0;
    arr.forEach((v, idx)=>{
        v.id=idx; v.children = undefined;
        v.key = idx;
    });
    if (useEtherTree) {
        return buildTreeEther(arr);
    }
    do {
        let cur = arr[idx++];
        if (cur.subtraces > 0) {
            console.log(`push `, cur.id, cur);
            parentQueue.push(cur)
            continue
        }
        do {
            const parent = parentQueue.pop();
            console.log(`pop `, parent?.id, ` cur id `, cur.id);
            if (!parent) {
                break
            }
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(cur)
            console.log(`add child ${cur.id} , parent ${parent.id} , ${parent.children.length } / ${parent.subtraces}`);
            if (parent.children.length < parent.subtraces) {
                console.log(` push back parent ${parent.id} `);
                parentQueue.push(parent)
                break // continue filling this parent
            }
            cur = parent
        } while(parentQueue.length)
    } while (idx<arr.length)
    console.log(`tree is `, parentQueue)
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
