import {Button, Card, Radio, Space} from "antd";
import Search from "antd/es/input/Search";
import {useEffect, useState} from "react";
import {NftInfo} from "./NftInfo.tsx";
import {EIP4337} from "../eip4337/conf.ts";
import {mergeV} from "../logic/utils.ts";
import {setChain} from "./nftLogic.ts";

type Param = {
    rpc: string, addr: string, chain: string
}

export const Migrator = () => {
    const rpc = EIP4337.nodeRpc;
    const addr = '0xb6D4B580AE43C245c2E9BE0fB464a89E770392CF'
    const [v, setV] = useState<Partial<Param>>({rpc, addr, chain: 'evm test'})
    const chains: string[] = [
        "core", "evm", "evm test"
    ]
    const chainOps = chains.map(chain => {
        return {label: chain, value: chain}
    })
    useEffect(() => {
        if (!v.chain) {
            return
        }
        setChain(v.chain);
        const useRcp = {
            // "core": "https://main-evmbridge.confluxrpc.com", // CORS problem
            "core": "http://43.198.102.234/evmbridge1029", // fix CORS
            "evm": "https://evm.confluxrpc.com",
            "evm test": "https://evmtestnet.confluxrpc.com",
        }[v.chain]
        setV(v => mergeV(v, {rpc: useRcp}))
    }, [v.chain])
    return (
        <Space direction={'vertical'} style={{textAlign: 'left', minWidth: '800px'}}>
            <h4 style={{textAlign: 'center',}}>Migrate NFT meta and resource to storage</h4>
            <Card title={"Chain and Contract"} size={'small'}>
                <Space direction={'vertical'} style={{textAlign: 'left', width: '100%'}}>
                    <Space>Chain: <Radio.Group options={chainOps} onChange={(e) => {
                        setV(v => mergeV(v, {chain: e.target.value}))
                    }} value={v.chain}/> |
                        <div> RPC: {v.rpc}</div>
                    </Space>
                    <Search value={v.addr} onChange={(elem) => setV(v => mergeV(v, {addr: elem.target.value}))}/>
                    <Space>Sample Contract:
                        <Button onClick={() => setV(v => mergeV(v, {
                            addr: 'cfx:achew68x34cwu04aezbunyaz67gppakvmyn79tau56'
                        }))} onMouseDown={e => e.preventDefault()} type={'default'} size={'small'}>TaoPai</Button>
                        <Button onClick={() => setV(v => mergeV(v, {addr: addr}))}
                                onMouseDown={e => e.preventDefault()} type={'default'} size={'small'}>Demo721</Button>
                    </Space>
                </Space>
            </Card>
            <NftInfo addr={v.addr} rpcUrl={v.rpc}/>
        </Space>
    )
}