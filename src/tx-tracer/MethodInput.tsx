import {Popover, Space, Tooltip, Typography} from "antd";
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
            // console.log(`res abi info`, res)
            if (!res.results.length) {
                return;
            }
            for (const fn of res.results) {
                const text_signature = fn.text_signature
                try {
                    const i = new ethers.utils.Interface([`function ${text_signature}`])
                    const params = i.decodeFunctionData(text_signature, input!);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    setDecoded(JSON.stringify(formatBigNumber(params), null, 4))
                    setV({text_signature: text_signature, short: text_signature?.substring(0, text_signature?.indexOf('(')), isSystem: false})
                    break
                } catch (e) {
                    console.log(`decodeFunctionData error: [${text_signature}] : ${e}`)
                }
            }
        })
    }, [input, createType, to]);

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
                {!v.isSystem && decoded && <Popover content={
                    <div style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}>
                        <pre>{decoded}</pre>
                    </div>
                } placement={'left'}>In</Popover>}
                {!decoded && <Typography.Text disabled>In</Typography.Text>}
                {out}
            </Space>
        </Space>
    )
}