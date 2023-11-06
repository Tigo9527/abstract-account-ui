import {useEffect, useState} from "react";
import {fetchJson} from "ethers/lib/utils";
import {storageConf} from "./conf.ts";
import {useParams} from "react-router-dom";
import {Card, Descriptions, Space} from "antd";
import {FileInfo} from "./FileInfo.tsx";

export const TxDetailWrap = () => {
    const {txSeq} = useParams<string>()
    if (!txSeq) {
        return "tx seq not found in the url hash"
    }
    console.log(`seq is `, txSeq)
    return (
        <TxDetail txSeqOrHash={txSeq}/>
    )
}

export interface IBrief {
    dataSize: number,

    loading?: boolean
}

export const TxDetail = ({txSeqOrHash}: { txSeqOrHash: string }) => {
    const [brief, setBrief] = useState({loading: true} as any & IBrief)
    const [detail, setDetail] = useState({loading: true} as any)
    const [error, setError] = useState('')
    const [txSeq, setTxSeq] = useState<string | undefined>('')
    useEffect(() => {
        if (!txSeq) {
            return
        }
        setError('');
        fetchJson(`${storageConf.rpc}/transaction/brief?txSeq=${txSeq}`).then(res => {
            setBrief(res.data)
        }).catch(e => {
            setBrief({loading: false})
            setError(`${e}`)
        })
        fetchJson(`${storageConf.rpc}/transaction/detail?txSeq=${txSeq}`).then(res => {
            setDetail(res.data)
        })
    }, [txSeq])
    return (
        <Space direction={'vertical'}>
            {txSeq != undefined && !brief.loading && brief.timestamp && <Card size={'small'} style={{maxWidth: '1024px'}}>
                <Descriptions title={`TxSeq#${txSeq}`}>
                    <Descriptions.Item span={3} label="From">{brief.from}</Descriptions.Item>
                    <Descriptions.Item span={3} label="TxHash">{brief.txHash}</Descriptions.Item>
                    <Descriptions.Item label="Data size">{brief.dataSize?.toLocaleString('en-US')}</Descriptions.Item>
                    <Descriptions.Item
                        label="timestamp">{new Date((brief.timestamp||1) * 1000).toISOString()}</Descriptions.Item>
                    <Descriptions.Item label="status">{brief.status}</Descriptions.Item>
                </Descriptions>
                <Descriptions>
                    <Descriptions.Item label="start pos">{detail.startPos?.toLocaleString('en-US')}</Descriptions.Item>
                    <Descriptions.Item label="start pos">{detail.endPos?.toLocaleString('en-US')}</Descriptions.Item>
                </Descriptions>
                <Descriptions>
                    <Descriptions.Item label="root hash"><span
                        style={{fontWeight: 'bold'}}>{detail.rootHash}</span></Descriptions.Item>
                </Descriptions>
                <Descriptions>
                    <Descriptions.Item label="segments">{detail.pieceCounts}</Descriptions.Item>
                </Descriptions>
                {
                    detail.pieces?.map((p: any) => {
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
            </Card>}
            <div style={{width: '800px'}}>{error}</div>
            <FileInfo hash={txSeqOrHash} setId={setTxSeq}/>
        </Space>
    );
}