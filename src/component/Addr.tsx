import {EIP4337} from "../eip4337/conf.ts";
import Link from "antd/es/typography/Link";
import {useEffect, useState} from "react";
import {Badge, Space} from "antd";
import {CopyIcon} from "./CopyIcon.tsx";

export function Addr({addr, short, checkCode=false, counter=0}:{addr:string, checkCode?:boolean, counter?: number, short?: boolean}) {
    const [hasCode, setHasCode] = useState(false)
    useEffect(()=>{
        if (!checkCode || !addr) {
            return
        }
        EIP4337.provider.getCode(addr).then(res=>{
            setHasCode(res != '0x')
        });
    }, [addr, checkCode, counter])
    return (
        <Space>
            <Link style={{fontFamily: 'monospace'}} target={'_blank'} href={`${EIP4337.scanUrl}/address/${addr}`}>{short ? addr?.substring(0,6).concat('...').concat(addr?.slice(-4)) : addr}</Link>
            <CopyIcon content={addr}/>
            {checkCode && <Badge color={hasCode ? 'green': 'red'} text={hasCode ? 'Deployed': 'Not Deployed'} />}
        </Space>
    )
}