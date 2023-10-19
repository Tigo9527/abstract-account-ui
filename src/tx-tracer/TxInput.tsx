import {Card, Col, Input, Radio, RadioChangeEvent, Row, Space} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {ethers} from "ethers";
import {traceContext} from "./Tracer.tsx";
import {rpcHolder, rpcHost as rpcConf} from "../logic/requestCache.ts";
import Search from "antd/es/input/Search";

export const TxInput = () => {
    const [rpcHost, setRpcHost] = useState(rpcConf)
    const [txHash, setTxHash] = useState(window.location.href.split('#')[1] || '')
    const [error, setError] = useState('')
    const [rpcSwitch, setRpcSwitch] = useState('test' as 'test' | 'evm' | 'other');

    const provider = useMemo(() => {
        const apiKey = '3M5xMwYFc5otj9brLq3JRnFaeoC2XPAv8svHu8Co3b2jSd37bLA8UCQzsE64SN7Y9JRS4HNgM2My4aqVR41iwKDK8'
        const rpc = rpcHost[rpcSwitch].rpc
        rpcHolder.rpc = rpc
        rpcHolder.api = rpcHost[rpcSwitch].api
        return new ethers.providers.JsonRpcProvider(rpc.startsWith('https') ? rpc + '/' + apiKey : rpc)
    }, [rpcSwitch, rpcHost.other.rpc, rpcHost.other.api])

    const loadTrace = useCallback(() => {
        if (!txHash) {
            return
        }
        traceContext.setTrace([])
        setError('')
        provider.send('trace_transaction', [txHash]).then(res => {
            console.log(`traces`, res)
            traceContext.setTrace(res)
        }).catch(e => {
            setError(`failed to fetch trace: ${e}`)
        })
    }, [txHash, provider])
    useEffect(loadTrace, [txHash, provider])

    const onChange = (e: RadioChangeEvent) => {
        // console.log('radio checked', e.target.value);
        setRpcSwitch(e.target.value);
    };
    useEffect(()=>{
        if (!txHash) {
            return
        }
        window.location.href = window.location.href.split('#')[0] + '#'+txHash;
    }, [txHash])
    return (
        <>
            <Space direction={'vertical'} style={{minWidth: '1024px'}}>
                <Card size={'small'}>
                    <Space direction={'vertical'}>
                        <Radio.Group onChange={onChange} value={rpcSwitch}>
                            <Space direction="vertical" style={{width: '1024px', textAlign: 'left'}}>
                                <Row>
                                    <Col span={2}>
                                        <Radio value={'test'}>Testnet</Radio>
                                    </Col>
                                    <Col span={11}>RPC: {rpcHost.test.rpc}</Col>
                                    <Col span={11}>API: {rpcHost.test.api}</Col>
                                </Row>
                                <Row>
                                    <Col span={2}>
                                        <Radio value={'evm'}>EVM</Radio>
                                    </Col>
                                    <Col span={11}>RPC: {rpcHost.evm.rpc}</Col>
                                    <Col span={11}>API: {rpcHost.evm.api}</Col>
                                </Row>
                                <Row>
                                    <Col span={2}>
                                        <Radio value={'other'}>Other</Radio>
                                    </Col>
                                    <Col span={11} style={{display: 'flex', paddingRight: '6px'}}>
                                        RPC: <Input value={rpcHost.other.rpc}
                                                               onChange={(e) => {
                                                                   setRpcHost((prevState) => {
                                                                       return {
                                                                           ...prevState,
                                                                           other: {
                                                                               ...prevState.other,
                                                                               rpc: e.target.value
                                                                           }
                                                                       }
                                                                   })
                                                               }}
                                                               style={{width: '90%'}} size={'small'}
                                                               disabled={rpcSwitch !== 'other'}/></Col>
                                    <Col span={11} style={{display: 'flex'}}>API: <Input value={rpcHost.other.api}
                                                               onChange={(e) => {
                                                                   setRpcHost((prevState) => {
                                                                       return {
                                                                           ...prevState,
                                                                           other: {
                                                                               ...prevState.other,
                                                                               api: e.target.value
                                                                           }
                                                                       }
                                                                   })
                                                               }}
                                                               size={'small'}
                                                               disabled={rpcSwitch !== 'other'}/></Col>
                                </Row>
                            </Space>
                        </Radio.Group>
                        <Space.Compact style={{width: '100%'}}>
                            <Search addonBefore="TxHash:" style={{marginTop: '8px'}} onSearch={loadTrace}
                                    value={txHash}
                                    onChange={(v) => setTxHash(v.target.value)}
                                    placeholder="input tx hash" allowClear/>
                        </Space.Compact>
                    </Space>
                </Card>
                <div style={{maxWidth: '1024px'}}>{error}</div>
            </Space>
        </>
    )
}