import {Input, Select, Space} from "antd";
import {useEffect, useMemo, useState} from "react";
import {ethers} from "ethers";

export const TxInput = () => {
    const urls = [
        '/proxy',
        'https://evmtestnet-internal.confluxrpc.com',
        'https://evm-internal.confluxrpc.com',
        'https://evmtestnet.confluxrpc.com',
        'https://evmtestnet.confluxscan.io/rpcv2/',
    ]
    const [rpc, setRpc] = useState(urls[0])
    const [txHash, setTxHash] = useState('')
    const [error, setError] = useState('')
    const provider = useMemo(()=>{
        return new ethers.providers.JsonRpcProvider(rpc)
    }, [rpc])

    useEffect(()=>{
        if (!txHash) {
            return
        }
        setError('')
        provider.send('trace_transaction', [ txHash ]).then(res=>{
            console.log(`traces`, res)
        }).catch(e=>{
            setError(`failed to fetch trace: ${e}`)
        })
    }, [txHash, provider])

    return (
        <>
            <Space direction={'vertical'} style={{width: '800px'}}>
                <Select
                    style={{width: '100%'}}
                    onChange={(v)=>setRpc(v)}
                    value={rpc}
                    options={urls.map(u => {
                        return {label: u, value: u,}
                    })}
                />
                <Input prefix={'TxHash:'} style={{width: '100%'}}
                       onChange={(v)=>setTxHash(v.target.value)}
                />
                <div>{error}</div>
            </Space>
        </>
    )
}