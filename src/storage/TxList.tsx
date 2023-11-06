import {Button, Card, Space, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {fetchJson} from "ethers/lib/utils";
import {storageConf} from "./conf.ts";
import Link from "antd/es/typography/Link";
import {Addr} from "../component/Addr.tsx";
import {Outlet, Link as RLink} from "react-router-dom";
import Search from "antd/es/input/Search";
import {TxDetail} from "./TxDetail.tsx";
import {ReloadOutlined} from "@ant-design/icons";

export const TxPage = () => {
    window.document.title = 'Storage'
    return (
        <Space direction={'vertical'}>
            <div style={{textAlign: 'right'}}><Link href={'/uploader/'}>Upload</Link></div>
            <Outlet/>
        </Space>
    )
}
export const TxList = () => {
    const [data, setData] = useState({list: [], total: 0})
    const [page, setPage] = useState({page: 1, pageSize: 10, tick: 0})
    const [searchKey, setSearchKey] = useState('')
    useEffect(() => {
        setData({list: [], total: 0})
        fetchJson(`${storageConf.rpc}/transaction/list?skip=${page.page * page.pageSize - page.pageSize}&limit=${page.pageSize}`).then(res => {
            setData(res.data)
        })
    }, [page])
    const search = useCallback((input: string) => {
        setSearchKey(input)
    }, [])

    const columns = [
        {
            title: 'txSeq',
            dataIndex: 'txSeq',
            key: 'txSeq',
            render: (v: string) => {
                return <RLink to={`detail/${v}`}>{v}</RLink>
            }
        },
        {
            title: 'txHash',
            dataIndex: 'txHash',
            key: 'txHash',
            render: (v: string) => {
                return <Link style={{fontFamily: 'monospace'}} target={'_blank'} href={`${storageConf.blockChainScan}/tx/${v}`}>{v.substring(0, 6)}</Link>
            }
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (v: string) => {
                return <Addr addr={v}/>
            }
        },
        {
            title: 'timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (v: number) => {
                return <span style={{fontFamily: 'monospace'}}>{new Date(v * 1000).toISOString()}</span>
            }
        },
    ];

    return (
        <Space direction={'vertical'}>
            <Search allowClear={true} style={{border: '0px solid blue'}} prefix={''} placeholder={'root hash or seq'}
                    onChange={(v)=>{
                        if (/(^0x[0-9a-fA-F]{64}$)|^(\d)+$/.test(v.target.value)) {
                            search(v.target.value)
                        }
                    }}
                    onSearch={search}/>
            {searchKey && <TxDetail txSeqOrHash={searchKey}/>}
            {!searchKey &&
                <Card size={'small'}>
                    <Space direction={'vertical'}>
                        <div>Storage Transactions ({data.total}) <Button
                            onMouseDown={(e)=>e.preventDefault()}
                            onClick={()=>setPage({...page, tick: Date.now()})} type={'text'}><ReloadOutlined/></Button></div>
                        <Table dataSource={data.list} columns={columns}
                               rowKey={'txSeq'}
                               style={{minWidth: '800px', fontFamily: 'monospace'}}
                               pagination={{
                                   total: data.total,
                                   onChange: (pg, size: number) => {
                                       setPage({page: pg, pageSize: size, tick: 0})
                                   }
                               }}
                        />
                    </Space>
                </Card>
            }
        </Space>
    )
}