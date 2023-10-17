import {Input, Select, Space} from "antd";
import {useEffect, useMemo, useState} from "react";
import {ethers} from "ethers";
import {traceContext} from "./Tracer.tsx";

export const TxInput = () => {
    const urls = [
        'https://evmtestnet.confluxrpc.com',
        // '/proxy',
    ]
    const [rpc, setRpc] = useState(urls[0])
    const [txHash, setTxHash] = useState('')
    const [error, setError] = useState('')
    const provider = useMemo(()=>{
        const apiKey = '3M5xMwYFc5otj9brLq3JRnFaeoC2XPAv8svHu8Co3b2jSd37bLA8UCQzsE64SN7Y9JRS4HNgM2My4aqVR41iwKDK8'
        return new ethers.providers.JsonRpcProvider(rpc.startsWith('https') ? rpc+'/'+apiKey : rpc)
    }, [rpc])

    useEffect(()=>{
        if (!txHash) {
            return
        }
        traceContext.setTrace([])
        setError('')
        provider.send('trace_transaction', [ txHash ]).then(res=>{
            console.log(`traces`, res)
            traceContext.setTrace(res)
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