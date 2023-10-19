import {Popover, Space, Tooltip} from "antd";
import {ReactNode, useEffect, useState} from "react";
import {fetchWithCache} from "../logic/requestCache.ts";
import {ethers} from "ethers/lib.esm";
import {formatBigNumber} from "../eip4337/utils.ts";

const SystemContracts:{[addr:string]: string} = {
    '0x0000000000000000000000000000000000000001': 'ecrecover',
    '0x0000000000000000000000000000000000000002': 'sha2-256',
    '0x0000000000000000000000000000000000000005': 'ModExp',
    '0x0000000000000000000000000000000000000009': 'keccak256',
}

export const MethodInput=({input, to, createType, out}:{input?:string, createType?:string, to?:string, out?:ReactNode})=>{
    const [v, setV] = useState({text_signature: '', short:'', isSystem: false})
    const [decoded, setDecoded] = useState('')

    useEffect(()=>{
        if ((input?.length || 0) < 10) {
            return
        }
        if (createType) {
            setV({text_signature: 'deploy', short: 'deploy', isSystem: false})
            return
        }
        const system = to ? SystemContracts[to] : '';
        if (system) {
            setV({text_signature: system, short: system, isSystem: true})
            setDecoded(input!)
            return;
        }
        // https://www.4byte.directory/api/v1/signatures/?format=json&hex_signature=0x16334de7
        const url = `https://www.4byte.directory/api/v1/signatures/?format=json&hex_signature=${input!.substring(0,10)}`;
        fetchWithCache(url).then(res=>{
            if (!res.results.length) {
                return;
            }
            // sort by length of function name
            const sorted = res.results.sort((a:any,b:any)=>{
                const diff = a.text_signature.indexOf('(') - b.text_signature.indexOf('(')
                if (diff == 0) {
                    return a.text_signature.length - b.text_signature.length
                }
                return  diff
            })
            const [{text_signature}] = sorted;
            setV({text_signature: text_signature, short: text_signature?.substring(0, text_signature?.indexOf('(')), isSystem: false})
            if (text_signature) {
                const i = new ethers.utils.Interface([`function ${text_signature}`])
                let params: any;
                try {
                    params = i.decodeFunctionData(text_signature, input!);
                } catch (e) {
                    console.log(`decodeFunctionData error: ${text_signature}`, e)
                }
                // console.log(`params is `, formatBigNumber(params))
                params && setDecoded(JSON.stringify(formatBigNumber(params), null, 4))
            }
        })
    }, [input]);

    return(
        <Space direction={'vertical'}>
            <Popover content={<div style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}
            >{input}</div>}>{input?.substring(0, 10)}</Popover>
            <Tooltip title={v.text_signature} placement={'left'} overlayInnerStyle={{maxWidth: '600px'}}>
                {v.short}
                {/*{v.text_signature || input?.substring(0,10)}*/}
            </Tooltip>
            <Space>
                {v.isSystem && <Popover content={
                    <div style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}
                    >{input}</div>
                } placement={'left'}>In</Popover>}
                {!v.isSystem && <Popover content={
                    <div style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}>
                        <pre>{decoded}</pre>
                    </div>
                } placement={'left'}>In</Popover>}
                {out}
            </Space>
        </Space>
    )
}