import {Popover, Space, Tooltip} from "antd";
import {useEffect, useState} from "react";
import {fetchWithCache} from "../logic/requestCache.ts";
import {ethers} from "ethers/lib.esm";
import {formatBigNumber} from "../eip4337/utils.ts";
import {InfoCircleOutlined} from "@ant-design/icons";

const SystemContracts = {
    '0x0000000000000000000000000000000000000001': 'ecrecover',
    '0x0000000000000000000000000000000000000002': 'sha2-256',
    '0x0000000000000000000000000000000000000009': 'keccak256',
}

export const MethodInput=({input, to, createType}:{input?:string, createType?:string, to?:string})=>{
    const [v, setV] = useState({text_signature: '', short:''})
    const [decoded, setDecoded] = useState('')

    useEffect(()=>{
        if ((input?.length || 0) < 10) {
            return
        }
        if (createType) {
            setV({text_signature: 'deploy', short: 'deploy'})
            return
        }
        const system = to ? SystemContracts[to] : '';
        if (system) {
            setV({text_signature: system, short: system})
        }
        // https://www.4byte.directory/api/v1/signatures/?format=json&hex_signature=0x16334de7
        const url = `https://www.4byte.directory/api/v1/signatures/?format=json&hex_signature=${input!.substring(0,10)}`;
        fetchWithCache(url).then(res=>{
            if (!res.results.length) {
                return;
            }
            const {results:[{text_signature}]} = res;
            setV({text_signature: text_signature, short: text_signature?.substring(0, text_signature?.indexOf('('))})
            if (text_signature) {
                const i = new ethers.utils.Interface([`function ${text_signature}`])
                const params = i.decodeFunctionData(text_signature, input!)
                // console.log(`params is `, formatBigNumber(params))
                setDecoded(JSON.stringify(formatBigNumber(params), null, 4))
            }
        })
    }, [input]);

    return(
        <Space direction={'vertical'}>
            {input?.substring(0, 10)}
            <Tooltip title={v.text_signature} placement={'left'} overlayInnerStyle={{maxWidth: '600px'}}>
                {v.short}
                {/*{v.text_signature || input?.substring(0,10)}*/}
            </Tooltip>
            <Space>
                <Popover content={<div style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}>{input}</div>}>Raw</Popover>
                <Popover content={<pre>{decoded}</pre>} placement={'left'}><InfoCircleOutlined/></Popover>
            </Space>
        </Space>
    )
}