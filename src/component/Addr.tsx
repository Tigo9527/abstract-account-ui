import {EIP4337} from "../eip4337/conf.ts";
import Link from "antd/es/typography/Link";
import {useEffect, useState} from "react";
import {Badge, Space} from "antd";

export function Addr({addr, checkCode=false, counter=0}:{addr:string, checkCode?:boolean, counter?: number}) {
    const [hasCode, setHasCode] = useState(false)
    useEffect(()=>{
        if (!checkCode || !addr) {
            return
        }
        EIP4337.provider.getCode(addr).then(res=>{
            setHasCode(res != '0x')
        });
    }, [addr, counter])
    return (
        <Space>
            <Link target={'_blank'} href={`${EIP4337.scanUrl}/address/${addr}`}>{addr}</Link>
            {checkCode && <Badge color={hasCode ? 'green': 'red'} text={hasCode ? 'Deployed': 'Not Deployed'} />}
        </Space>
    )
}