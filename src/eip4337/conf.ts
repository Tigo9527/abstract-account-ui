import {ethers} from "ethers";

const nodeRpc = 'https://evmtestnet.confluxrpc.com';
const host = window.location.host;
const hasHost = host.includes('confluxscan')
export const EIP4337 = {
    nodeRpc: nodeRpc,
    // bundlerRpc: 'http://127.0.0.1:4337',
    bundlerRpc: '/bundler',
    entryPoint: {
        '71': '0x7ad823a5ca21768a3d3041118bc6e981b0e4d5ee'
    },
    accountFactory: '0xd88D097bb059bB1DF45CFF8eBa1bF16A8F12070d',
    rsaFactory: '0x089C3F0E4FdC735a7Ae2bEf41246812aE43fde72',
    provider: ethers.getDefaultProvider(nodeRpc),
    scanUrl: hasHost ? '' : 'https://evmtestnet.confluxscan.io',
    demoErc20: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355',
}