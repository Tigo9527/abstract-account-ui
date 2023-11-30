import {BigNumberish, ethers} from "ethers";
import {Space} from "antd";
import {useCallback, useEffect, useState} from "react";
import {fetchJson} from "ethers/lib/utils";
import {mergeV} from "../logic/utils.ts";

type Param = {
    contract: ethers.Contract, tokenId: BigNumberish, erc: string,
}
type MetaData = {
    uri: string, image: string, metaStr: string,
    error: string,
}
export const MetaView = ({contract, tokenId, erc}:Param) => {
    const [v, setV] = useState<Partial<MetaData>>({})
    const clearError = ()=>{
        setV(v=>mergeV(v, {error: ''}))
    }
    const update = useCallback(()=>{
        console.log(`token id `, tokenId)
        if (!contract || typeof(tokenId) === 'string') {
            console.log(`returned, `, typeof(tokenId))
            return
        }
        clearError()
        const method = {'1155':'uri', '721':'tokenURI'}[erc]
        if (!method) {
            setV({error: `unknown erc type [${erc}]`})
            return;
        }
        contract[method](tokenId).then((res:string)=>{
            setV(v=>mergeV(v, {uri: res}))
        }).catch((e: Error)=>{
            setV(v=>mergeV(v, {error: `Failed to call ${method}: ${e}`}))
        });
    }, [erc, contract, tokenId])
    useEffect(()=>{
        update()
    }, [update])
    useEffect(()=>{
        if (!v.uri) {
            return
        }
        clearError();
        const reqUrl = v.uri.includes("{id}") ?
            v.uri.replace("{id}", ethers.utils.hexlify(tokenId).substring(2).padStart(64, '0'))
            : v.uri
        fetchJson(reqUrl).then(res=>{
            setV(v=>mergeV(v, {
                metaStr: JSON.stringify(res, null, 4),
                image: res?.image
            }))
        }).catch((e:Error)=>{
            setV(v=>mergeV(v, {error: `Failed to fetch meta: ${e}`}))
        })
    }, [tokenId, v.uri])
    return (
        <Space direction={'vertical'} style={{textAlign: 'left', border: '0px solid white'}}>
            <div>Sample Token ID: {tokenId.toString()}</div>
            <div style={{width: '800px', overflow: "auto"}}>URI: {v.uri}</div>
            <div style={{maxWidth: '800px', maxHeight: '200px', overflow: "auto"}}>Meta data: <pre>{v.metaStr}</pre></div>
            <div style={{maxWidth: '800px', overflow: "auto"}}>Image: {v.image}</div>
            {v.image &&
                <div>
                    <img style={{maxWidth: '800px'}} src={v.image} alt={v.image}/>
                </div>
            }
            <div style={{color: 'red', maxWidth: '800px'}}>{v.error}</div>
        </Space>
    )
}