import {useEffect, useState} from "react";
import {fetchJson} from "ethers/lib/utils";
import {storageConf} from "./conf.ts";
import {useParams} from "react-router-dom";
import {Card, Descriptions} from "antd";

export const TxDetailWrap = ()=>{
    const {txSeq} = useParams<string>()
    if (!txSeq) {
        return "tx seq not found in the url hash"
    }
    console.log(`seq is `, txSeq)
    return (
        <TxDetail txSeq={txSeq.toString()}/>
    )
}
export interface IBrief {
    dataSize: number,

    loading?:boolean
}
export const TxDetail = ({txSeq}:{txSeq: number|string})=>{
    const [brief, setBrief] = useState({loading:true} as any & IBrief)
    const [detail, setDetail] = useState({loading:true} as any)
    useEffect(()=>{
        fetchJson(`${storageConf.rpc}/transaction/brief?txSeq=${txSeq}`).then(res=>{
            setBrief(res.data)
        })
        fetchJson(`${storageConf.rpc}/transaction/detail?txSeq=${txSeq}`).then(res=>{
            setDetail(res.data)
        })
    }, [txSeq])
    if (brief.loading) {
        return 'loading'
    }
    return (
        <Card size={'small'}>
            <Descriptions title={`TxSeq#${txSeq}`}>
                <Descriptions.Item label="From">{brief.from}</Descriptions.Item>
                <Descriptions.Item span={2} label="TxHash">{brief.txHash}</Descriptions.Item>
                <Descriptions.Item label="Data size">{brief.dataSize?.toLocaleString('en-US')}</Descriptions.Item>
                <Descriptions.Item label="timestamp">{new Date(brief.timestamp*1000).toISOString()}</Descriptions.Item>
                <Descriptions.Item label="status">{brief.status}</Descriptions.Item>
            </Descriptions>
            <Descriptions>
                <Descriptions.Item label="start pos">{detail.startPos?.toLocaleString('en-US')}</Descriptions.Item>
                <Descriptions.Item label="start pos">{detail.endPos?.toLocaleString('en-US')}</Descriptions.Item>
            </Descriptions>
            <Descriptions>
                <Descriptions.Item label="segments">{detail.pieceCounts}</Descriptions.Item>
            </Descriptions>
            {
                detail.pieces?.map(p=>{
                    return (
                        <>
                            <Descriptions>
                                <Descriptions.Item span={2} label="root">{p.root}</Descriptions.Item>
                                <Descriptions.Item label="height">{p.height}</Descriptions.Item>
                            </Descriptions>
                        </>
                    )
                })
            }
        </Card>
    );
}