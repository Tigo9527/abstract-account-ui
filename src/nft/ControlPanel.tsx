import {Button, Card, Space} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {fetchJson} from "ethers/lib/utils";
import {ReloadOutlined} from "@ant-design/icons";
import Link from "antd/es/typography/Link";
import {BigNumberish} from "ethers";
import {convertStatus600, mergeV} from "../logic/utils.ts";
import {getChain} from "./nftLogic.ts";
import {CopyIcon} from "../component/CopyIcon.tsx";

type Param = {
    addr?: string, sampleId?: string|BigNumberish|null, erc: string,
}
type MigData = {
    id: number
    addr: string, totalSupply: number, downloadedMeta: number, status: string,
    // imageHash: string, metaHash: string,
    // imageLayer1tx: string, metaLayer1tx: string,
    root: string,
    imageUploaded: boolean, metaUploaded: boolean,
    created_at: string,
    // ui
    error: string, loading: boolean
}
export const ControlPanel = ({addr, sampleId, erc}: Param) => {
    const {protocol, hostname} = window.location
    const metaHost = window.location.protocol.startsWith("https") ? `${protocol}//${hostname}` : "https://www.clonex.fun"
    const [v, setV] = useState<Partial<MigData>>({loading: true})
    const newUri = useMemo(()=>{
        return erc === '721' ? `${metaHost}/nft-house/storage/meta/${v.root}/` : `${metaHost}/nft-house/storage/meta/${v.root}/{id}`
    }, [erc, metaHost, v])
    const fetchInfo = useCallback(()=>{
        if (!addr) {
            return
        }
        fetchJson(`/nft-house/migration-result?addr=${addr}`).then(res=>{
            setV(res.data)
        }).catch((e: Error)=>{
            setV(v=>mergeV(v, {error: `Failed to load migration info: ${e}`}))
        }).finally(()=>{
            setV(v=>mergeV(v, {loading: false}))
        });
    }, [addr])

    const goToNextStep = useCallback(()=>{
        fetchJson(`/nft-house/skip-download?addr=${addr}`).then(()=>{
            fetchInfo()
        })
    }, [addr, fetchInfo]);
    const deleteMigration = useCallback(()=>{
        fetchJson(`/nft-house/delete-migration?addr=${addr}`).catch(convertStatus600).then((res)=>{
            alert("result: "+JSON.stringify(res))
            fetchInfo()
        })
    }, [addr, fetchInfo]);
    const abortMigration = useCallback(()=>{
        fetchJson(`/nft-house/abort-migration?addr=${addr}`).catch(convertStatus600).then((res)=>{
            alert("result: "+res.data+":"+res.message)
            fetchInfo()
        })
    }, [addr, fetchInfo]);
    useEffect(()=>{
        fetchInfo()
    }, [fetchInfo])

    const addMigration = useCallback(()=>{
        const str = {
            "core": "https://main.confluxrpc.com",
            "test": "https://test.confluxrpc.com",
            "evm": "https://evm.confluxrpc.com/cfxbridge",
            "evm test": "https://evmtestnet.confluxrpc.com/cfxbridge"
        }[getChain()]
        if (!str) {
            alert("unsupported chain, missing configuration.")
            return;
        }
        const chainRpc = encodeURIComponent(str!);
        fetchJson(`/nft-house/add-migration?addr=${addr}&chainRpc=${chainRpc}&erc=${erc}`, "{}").then(res=> {
            console.log(`add-migration result`, res)
        }).then(()=>{
            fetchInfo()
        }).catch((e: any)=>{
            if (e.status === 600) {
                const json = JSON.parse(e.body);
                setV(v=>mergeV(v, {error: json.data + ";" + json.message}))
            } else {
                setV(v=>mergeV(v, {error: `Operation Failed: ${e}`}))
            }
            // console.log(`error keys `, Object.keys(e))
            // console.log(`error is `, e.body)
        })
    }, [addr, fetchInfo, erc])

    if (v.loading) {
        return "loading..."
    }
    return (
        <Card title={<>Migration Info <Button
            onClick={fetchInfo} type={'text'}
            size={'small'} onMouseDown={e=>e.preventDefault()}
        ><ReloadOutlined/></Button></>} size={'small'} style={{maxWidth:'800px'}}>
        <Space style={{textAlign: 'left', width: '100%'}} direction={'vertical'}>
                {v.id === undefined && (erc === '721' || erc === '1155') &&
                <Space>
                        <>No migration record.</>
                    <Button size={'small'} onClick={addMigration}>Add Migration</Button>
                </Space>
                }
            <div style={{display: v.status ? 'flex' : 'none', justifyContent: 'space-evenly', border: '0px solid blue'}}>
                <div>Status: {v.status}</div>
                {v.status === 'download' && (v.downloadedMeta ?? 0) > 0 &&
                    <div><Button type={'default'} onClick={goToNextStep} size={'small'}>Go to next step</Button></div>
                }
                {v.status?.includes("waitUploading") &&
                    <div><Button type={'default'} onClick={abortMigration} size={'small'}>Abort and delete Task</Button></div>
                }
                {(v.status == 'finished' || v.status == 'download') &&
                    <div><Button type={'default'} onClick={deleteMigration} size={'small'}>Delete record</Button></div>
                }
                <div>Downloaded meta data count: {v.downloadedMeta}
                    <span style={{color:'orange'}}>{v.status == 'finished' && ((v.downloadedMeta || 0) < (v.totalSupply || 0)) ? " (reaches server side limit)":""}</span>
                </div>
            </div>
            <div style={{display: v.status ? "" : 'none'}}>
                <div>Meta Root Hash: {v.root}</div>
                {v.metaUploaded && <>
                    <div>Sample meta: <Link target={"_blank"} href={`${metaHost}/nft-house/storage/meta/${v.root}/${sampleId}`}>
                            {v.root ? 'preview' : ''}
                        </Link>
                    </div>
                    <Space>
                        <div style={{color: 'orangered'}}>Now you can set {erc === '721' ? 'baseURI' : 'uri'} of your contract to:
                        </div>
                            <CopyIcon content={newUri}/>
                    </Space>
                    <div style={{color: '', overflow: 'auto'}}><pre>{
                        newUri
                    }</pre></div>
                </>}
            </div>
            {v.error && <div style={{maxWidth: '800px'}}>{v.error}</div>}
        </Space>
        </Card>
    );
}