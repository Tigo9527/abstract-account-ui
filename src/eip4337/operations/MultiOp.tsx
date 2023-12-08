import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {Button, Space} from "antd";
import {OP} from "./Op.tsx";
import {MinusOutlined, PlusOutlined} from "@ant-design/icons";
import {EIP4337} from "../conf.ts";
import {abiInterface} from "../abi.ts";
import {parseEther} from "ethers/lib/utils";
import {OpsData} from "../CreateAA.tsx";
import {Addr} from "../../component/Addr.tsx";

type OpInput = {
    id: string, action: string, address: string, amount:string
}

export function MultiOp({opReceiver, defaultAddr}: {
    opReceiver: Dispatch<SetStateAction<OpsData>>,
    defaultAddr?: string
}) {
    const [ids, setIds] = useState<number[]>([1])
    const [map, setMap] = useState<Map<string, OpInput>>(new Map())

    const add = useCallback(()=>{
        setIds(old=>[...old, Date.now()])
    }, [])
    const remove = useCallback((id:number)=>{
        setIds(old=>{
            return old.filter(i=>i !== id)
        })
    }, [])

    useEffect(()=> {
        try {
            const data: OpsData = {
                destArr: ids.map((id) => {
                    const input = map.get(id.toString())!
                    return input.action === 'safeMint' ? EIP4337.demoErc721 : EIP4337.demoErc20
                }),
                fnArr: ids.map((id) => {
                    const input = map.get(id.toString())!
                    return input.action === 'safeMint' ?
                        abiInterface.encodeFunctionData(input.action, [input.address])
                        :
                        abiInterface.encodeFunctionData(input.action.toLowerCase(), [input.address, parseEther(input.amount.toString())])
                })
            }
            // console.log(`report data`, data)
            opReceiver(data)
        } catch (e) {
            opReceiver({})
            // alert(`Failed to encode function ${e}`)
        }
    }, [ids, map, opReceiver]);

    const fn = useCallback((_:OpInput, allValues:OpInput)=>{
        // console.log(`allValues`, allValues)
        map.set(allValues.id, allValues)
        // console.log(`map size: `, map.size)
        setMap(new Map(map))
    }, [map])
    return (
        <Space direction={'vertical'}>
            <div>(Mint,Approve,Transfer) will call to ERC20: <Addr addr={EIP4337.demoErc20} short={true}/></div>
            <div>(safeMint) will call to ERC721: <Addr addr={EIP4337.demoErc721} short={true}/></div>
            {ids.map((i, )=>{
                return <OP key={i} btn={
                    <Button type={'text'} disabled={ids.length===1} onClick={()=>remove(i)}><MinusOutlined/></Button>
                }
                           onValuesChange={fn} id={i.toString()}
                           defaultAddr={defaultAddr}
                />
            })}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add
            </Button>
        </Space>
    )
}