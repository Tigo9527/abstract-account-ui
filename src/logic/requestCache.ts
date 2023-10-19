import {fetchJson} from "ethers/lib/utils";
export interface IRpcHost {
    rpc: string, api: string
}
export const rpcHolder: IRpcHost = {
    rpc: '', api: ''
}
export const rpcHost = {
    "test": {
        rpc: 'https://evmtestnet.confluxrpc.com',
        api: 'https://evmapi-testnet.confluxscan.io'
    },
    "evm": {
        rpc: 'https://evm.confluxrpc.com',
        api: 'https://evmapi.confluxscan.io'
    },
    other: {
        rpc: 'https://evmtestnet.confluxrpc.com',
        api: 'http://localhost:5173',
    }
}

const map = new Map<string, Promise<any>>();
export async function fetchWithCache(url: string) {
    if (map.has(url)) {
        return map.get(url)
    }
    const req = fetchJson(url);
    map.set(url, req);
    return req;
}