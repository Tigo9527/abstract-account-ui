import {Button, Card, Radio, Space, Tabs} from "antd";
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
    return <Card>
        <h4 style={{textAlign: 'center',}}>Migrate NFT meta and resource to storage</h4>
        <MigratorIndex/>
        <Tabs items={[
            // {key: "1", label: "Migrate", children: <MigratorIndex/>},
            // {key: "2", label: "Build Meta", children: <BuildMeta/>},
        ]}></Tabs>
    </Card>
}
export const MigratorIndex = () => {
    window.document.title = 'NFT Meta'
    const rpc = EIP4337.nodeRpc;
    const isLocal = window.location.hostname === 'localhost'
    const addr = isLocal ? '0xb6D4B580AE43C245c2E9BE0fB464a89E770392CF' : ''
    const [v, setV] = useState<Partial<Param>>({rpc, addr, chain: isLocal ? 'evm test' : ''})
    const chains: string[] = [
        "core", "test", "evm", "evm test"
    ]
    const sampleContracts: any = {
        "core": [
            {name: "TaoPai", addr: "cfx:achew68x34cwu04aezbunyaz67gppakvmyn79tau56"},
            {name: "LiangZi", addr: "cfx:acdc52ftht4a43e9uk7zud4jthk6rbbrxjjn881x1v"}
        ],
        "test": [{name: "test", addr: "cfxtest:acafj6suf4z17rhdz0zzb66729rnzun8tage6er7ta"}],
        "evm": [{name: "hero", addr: "0x634e34e0f9c09dba2e61a398f7b76e6327b97916"}],
        "evm test": [{name: "Demo721", addr}, {name: "Demo1155", addr: "0xBEe04d509A2599c9F816c0386Afd6771D6b18119"}],
    }
    const chainOps = chains.map(chain => {
        return {label: chain, value: chain}
    })
    useEffect(() => {
        if (!v.chain) {
            return
        }
        setChain(v.chain);
        const useRcp = {
            "core": "https://main-evmbridge.confluxrpc.com",
            "test": "https://test-evmbridge.confluxrpc.com",
            "evm": "https://evm.confluxrpc.com",
            "evm test": "https://evmtestnet.confluxrpc.com",
        }[v.chain]
        setV(v => mergeV(v, {rpc: useRcp}))
    }, [v.chain])
    return (
        <Space direction={'vertical'} style={{textAlign: 'left', width: '800px'}}>
            <Card title={"Chain and Contract"} size={'small'}>
                <Space direction={'vertical'} style={{textAlign: 'left', width: '100%'}}>
                    <Space>Chain: <Radio.Group options={chainOps} onChange={(e) => {
                        setV(v => mergeV(v, {chain: e.target.value}))
                    }} value={v.chain}/>
                        {/*|*/}
                        {/*<div> RPC: {v.rpc}</div>*/}
                    </Space>
                    <Search value={v.addr} onChange={(elem) => setV(v => mergeV(v, {addr: elem.target.value}))}/>
                    { window.location.hostname === 'localhost' &&
                        <Space>Sample Contract:
                        {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            (sampleContracts[v.chain] || []).map(({addr, name}) => {
                                return <Button key={name} onClick={() => setV(v => mergeV(v, {addr: addr}))}
                                               onMouseDown={e => e.preventDefault()} type={'default'}
                                               size={'small'}>{name}</Button>
                            })}
                        </Space>}
                </Space>
            </Card>
            <NftInfo addr={v.addr} rpcUrl={v.rpc}/>
        </Space>
    )
}