import {Addr} from "../component/Addr.tsx";
import {useEffect, useState} from "react";
import {hexlify} from "ethers/lib/utils";
import {Space} from "antd";
import {address} from "js-conflux-sdk";
import {fetchWithCache, rpcHolder} from "../logic/requestCache.ts";
// import {EIP4337} from "../eip4337/conf.ts";

export const AddrName=({addr}:{addr:string})=>{
    const [v,setV] = useState({
        'ContractName': '', Implementation:'', loading: true, error: false as boolean|string
    })
    const [tokenInfo, setTokenInfo] = useState({symbol: ''})
    useEffect(()=>{
        fetchWithCache(`${rpcHolder.api}/api?module=contract&action=getsourcecode&address=${addr}`).then(res=>{
            const first = (res.result || [])[0];
            if (first?.Implementation && !first?.Implementation?.startsWith('0x')) {
                const hex = hexlify(address.decodeCfxAddress(first.Implementation).hexAddress)
                first.Implementation = hex;
                // console.log(`decode `, )
            }
            setV(first)
        }).catch(e=>{
            setV({...v, error: `api error: ${e}`})
        })
        fetchWithCache(`${rpcHolder.api}/api?module=token&action=tokeninfo&contractaddress=${addr}`).then(res=>{
            res.result && setTokenInfo(res.result[0])
        })
    }, [addr])
    return (
        <Space direction={'vertical'} size={'small'}>
            <Addr addr={addr} short={true}/>
            <span>{v?.ContractName?.split(':')[1] || v?.ContractName}{tokenInfo?.symbol ? `(${tokenInfo.symbol})` : ''}</span>
            {v?.Implementation &&
                <AddrName addr={v.Implementation}/>
            }
        </Space>
    );
}