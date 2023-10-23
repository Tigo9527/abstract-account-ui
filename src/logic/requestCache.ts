import {fetchJson} from "ethers/lib/utils";
export interface IRpcHost {
    rpc: string, api: string
}
export const rpcHolder: IRpcHost = {
    rpc: '', api: ''
}
const browserHost = window.location.hostname;
const useDotNet = browserHost.endsWith('.net');
export const rpcHost = {
    "test": {
        rpc: 'https://evmtestnet.confluxrpc.com',
        api: useDotNet ? 'https://evmapi-testnet.confluxscan.net' : 'https://evmapi-testnet.confluxscan.io'
    },
    "evm": {
        rpc: 'https://evm.confluxrpc.com',
        api: useDotNet ? 'https://evmapi.confluxscan.net' : 'https://evmapi.confluxscan.io'
    },
    other: {
        rpc: 'https://evmtestnet.confluxrpc.com',
        api: 'https://evmapi-testnet.confluxscan.io',
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