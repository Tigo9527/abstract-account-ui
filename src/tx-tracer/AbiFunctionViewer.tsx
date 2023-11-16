import {ITrace} from "./traceParser.ts";
import {useCallback, useEffect, useState} from "react";
import {fetchWithCache, rpcHolder} from "../logic/requestCache.ts";
import {ethers} from "ethers";
import {Badge, Popover, Space} from "antd";
import {mergeAbiAndData} from "../eip4337/utils.ts";
import {hexlify} from "ethers/lib/utils";
import {address} from "js-conflux-sdk";
import {MethodOutput} from "./MethodOutput.tsx";
import {MethodInput} from "./MethodInput.tsx";

export const AbiFunctionViewer = ({record}:{record: ITrace})=>{
    const [hasSource, setHasSource] = useState('loading' as 'loading'|'src'|'miss')
    const [err, setErr] = useState('')
    const [param, setParam] = useState({paramIn: '', paramOut: '', fn: ''})
    const parseAbi = useCallback((input: string, first?:{ABI:string[]})=>{
        if (!first || !first.ABI) {
            return false
        }
        const abiFace = new ethers.utils.Interface(first.ABI);
        let hit = false
        for (const name of Object.keys(abiFace.functions)) {
            // console.log(`name is `, name)
            const fn = abiFace.functions[name];
            const sighash = abiFace.getSighash(fn);
            if (!input.startsWith(sighash)) {
                // console.log(`not match method: `, name, sighash)
                continue
            }
            const fnDecoded = abiFace.decodeFunctionData(fn, input)
            // console.log('function is ', fn)
            // console.log('decoded is ', fnDecoded)
            const mergedStr = mergeAbiAndData(fn.inputs, fnDecoded, '')
            // const inputJson = JSON.stringify(fnDecoded, null, 4);
            // console.log(`decoded :\n`, mergedStr)

            let out = ''
            if (record.result?.output && fn.outputs?.length) {
                const retDecoded = abiFace.decodeFunctionResult(fn, record.result?.output)
                out = mergeAbiAndData(fn.outputs, retDecoded, '')
            }

            setParam({paramIn: mergedStr, paramOut: out, fn: fn.format('full')})
            hit = true
            // console.log(`matched function`, name, input.substring(0, 10))
            break
        }
        // console.log(`hit ? `, hit);
        return hit
    }, [record.result?.output])

    useEffect(()=>{
        if (record.action.createType) {
            setHasSource('src')
            return;
        }
        const input = record.action.input;
        const to = record.action.to
        if (!input || !to) {
            return;
        }
        fetchWithCache(`${rpcHolder.api}/api?module=contract&action=getsourcecode&address=${to}`).then(res=> {
            const first = (res.result || [])[0];
            if (!first || !first.ABI) {
                setHasSource('miss')
                return
            }
            // console.log(`match proxy maybe`)
            if (parseAbi(input, first)) {
                setHasSource('src')
                return
            }
            if (first?.Implementation) {
                let hex = first?.Implementation;
                if (!first?.Implementation?.startsWith('0x')) {
                    hex = hexlify(address.decodeCfxAddress(first.Implementation).hexAddress)
                }
                return fetchWithCache(`${rpcHolder.api}/api?module=contract&action=getsourcecode&address=${hex}`).then(res=> {
                    const first = (res.result || [])[0];
                    // console.log(`match implementation`)
                    if (parseAbi(input, first)) {
                        setHasSource('src')
                    } else {
                        setHasSource('miss')
                    }
                })
            }
        }).catch(e=>{
            setErr(`failed to fetch: ${e}`)
        })
    }, [parseAbi, record])
    if (hasSource === 'miss' || err) {
        return <Space direction={'vertical'}>
            {err && <Popover content={<div style={{maxWidth: '800px', wordWrap: 'break-word', overflow: "auto"}}>{err}</div>}
            ><Badge color={'red'}/> api error</Popover>}
            <MethodInput createType={record.action.createType}
                            to={record.action.to} input={record.action.input || record.action.init}
                            out={<MethodOutput to={record.action.to} input={record.result?.output}/>}
            />
        </Space> ;
    } else if (hasSource === 'loading') {
        return 'loading'
    }
    return (
        <Space direction={"vertical"}>
            {param.fn ?
                <Popover content={<div
                        style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}
                    ><pre>{param.fn}</pre></div>}>
                    {param.fn.substring(param.fn.indexOf(' '), param.fn.indexOf('('))}
                </Popover> : ''
            }
            {record.action.createType && <div>{record.action.createType}</div>}
            <Space>
                <Popover content={<div
                    style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}
                ><pre>{param.paramIn || record.action?.input || record.action.init}</pre></div>}>In</Popover>

                <Popover content={<div
                    style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}
                ><pre>{param.paramOut || record.result?.output || record.result?.address}</pre></div>}>Out</Popover>
            </Space>
        </Space>
    );
}