import {ITrace} from "./traceParser.ts";
import {useEffect, useState} from "react";
import {fetchWithCache} from "../logic/requestCache.ts";
import {ethers} from "ethers";
import {Popover, Space} from "antd";
import {mergeAbiAndData} from "../eip4337/utils.ts";
import {Simulate} from "react-dom/test-utils";
import input = Simulate.input;

export const AbiFunctionViewer = ({record}:{record: ITrace})=>{
    const [param, setParam] = useState({paramIn: '', paramOut: ''})
    useEffect(()=>{
        const input = record.action.input
        if (!input) {
            return;
        }
        const to = record.action.to || record.result.address;
        if (!to) {
            return
        }
        fetchWithCache(`/api?module=contract&action=getsourcecode&address=${to}`).then(res=> {
            const first = (res.result || [])[0];
            if (!first || !first.ABI) {
                return
            }
            console.log(`contract ${first.ContractName}, input sig hash ${input?.substring(0, 10)}`)
            const abiFace = new ethers.utils.Interface(first.ABI);
            for (const name of Object.keys(abiFace.functions)) {
                // console.log(`name is `, name)
                const fn = abiFace.functions[name];
                const sighash = abiFace.getSighash(fn);
                if (!input.startsWith(sighash)) {
                    continue
                }
                const fnDecoded = abiFace.decodeFunctionData(fn, input)
                console.log('function is ', fn)
                console.log('decoded is ', fnDecoded)
                const mergedStr = mergeAbiAndData(fn.inputs, fnDecoded, '')
                // const inputJson = JSON.stringify(fnDecoded, null, 4);
                console.log(`decoded :\n`, mergedStr)
                setParam({paramIn: mergedStr, paramOut: ''})
            }
        })
    }, [record])
    return (
        <Space>
            {param.paramIn ? <Popover content={<div
                style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap:'break-word'}}
            ><pre>{param.paramIn}</pre></div>}>In</Popover> : '?'}
            {param.paramOut ? <Popover content={<div>{param.paramOut}</div>}>Out</Popover> : '?'}
        </Space>
    )
}