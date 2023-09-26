import {useCallback, useEffect, useState} from "react";
import {EIP4337} from "../eip4337/conf.ts";
import {BigNumber} from "ethers/lib.esm";
import {formatEther} from "ethers/lib/utils";

export function Balance({addr, counter=0, setFn}:{addr:string, counter?: number, setFn?: (b:BigNumber)=>void}) {
    const [aaAddrB, setAddrB] = useState(BigNumber.from(0))
    const up = useCallback(()=>{
        if (!addr) {
            return
        }
        EIP4337.provider.getBalance(addr).then(res=>{
            setAddrB(res)
            setFn && setFn(res)
        });
    }, [addr, counter])
    useEffect(()=>{
        up()
    },[addr])
    return (
        <>
            <div style={{cursor:'pointer'}} onClick={up}>{formatEther(aaAddrB)}</div>
        </>
    )
}