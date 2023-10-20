import {Card, Table} from "antd";
import {useEffect, useState} from "react";
import {fetchJson} from "ethers/lib/utils";
import {storageConf} from "./conf.ts";
import Link from "antd/es/typography/Link";
import {Addr} from "../component/Addr.tsx";
import {Outlet, Link as RLink } from "react-router-dom";
export const TxPage = ()=>{
    window.document.title = 'Storage'
    return (
        <><Outlet/></>
    )
}
export const TxList = ()=>{
    const [data, setData] = useState({list:[], total: 0})
    const [page, setPage] = useState({page: 1, pageSize: 10})
    useEffect(()=>{
        fetchJson(`${storageConf.rpc}/transaction/list?skip=${page.page * page.pageSize - page.pageSize}&limit=${page.pageSize}`).then(res=>{
            setData(res.data)
        })
    }, [page])

    const columns = [
        {
            title: 'txSeq',
            dataIndex: 'txSeq',
            key: 'txSeq',
            render: (v:string)=>{
                return <RLink to={`detail/${v}`}>{v}</RLink>
            }
        },
        {
            title: 'txHash',
            dataIndex: 'txHash',
            key: 'txHash',
            render: (v:string)=>{
                return <Link target={'_blank'} href={`${storageConf.blockChainScan}/tx/${v}`}>{v.substring(0, 6)}</Link>
            }
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (v:string)=>{
                return <Addr addr={v}/>
            }
        },
        {
            title: 'timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (v:number)=>{
                return new Date(v*1000).toISOString()
            }
        },
    ];

    return (
        <Card size={'small'}>
            Storage Transactions ({data.total})
            <Table dataSource={data.list} columns={columns}
                   rowKey={'txSeq'}
                   pagination={{
                       total: data.total,
                       onChange: (pg, size:number)=>{
                           setPage({page: pg, pageSize: size})
                       }
                   }}
            />
        </Card>
    )
}