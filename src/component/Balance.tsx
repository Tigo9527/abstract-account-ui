import {useCallback, useEffect, useState} from "react";
import {EIP4337} from "../eip4337/conf.ts";
import {BigNumber} from "ethers/lib.esm";
import {formatEther} from "ethers/lib/utils";
import {Popover, Spin} from "antd";

export function Balance({addr, counter = 0, setFn}: {
    addr: string,
    counter?: number,
    setFn?: (b: BigNumber) => void
}) {
    const [aaAddrB, setAddrB] = useState(BigNumber.from(0))
    const [isSpin, setSpin] = useState(true)
    const up = useCallback(() => {
        if (!addr) {
            return
        }
        setSpin(true);
        EIP4337.provider.getBalance(addr).then(res => {
            setAddrB(res);
            setFn && setFn(res)
        }).finally(()=>{
            setSpin(false)
        });
    }, [addr])
    useEffect(() => {
        up()
    }, [addr, counter])
    useEffect(() => {
        if (aaAddrB.gt(BigNumber.from(0))) {
            return
        }
        const intervalId = setInterval(up,2_000);
        return(() => {
            clearInterval(intervalId)
        })
    },[aaAddrB])
    if (isSpin) {
        return  <Spin/>
    }
    return (
        <>
            <Popover content={'Balance, click to refresh'}>
                <div style={{cursor: 'pointer', color: aaAddrB.eq(0) ? 'red': ''}} onClick={up}>
                    {formatEther(aaAddrB)}
                </div>
            </Popover>
        </>
    );
}