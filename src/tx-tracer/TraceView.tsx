import {Badge, Space, Table, Tooltip} from "antd";
import {ColumnsType} from "antd/es/table";
import {buildTree, ITrace} from "./traceParser.ts";
import {fakeData} from "./fakeData.ts";
import {formatEther} from "ethers/lib/utils";
import {MethodInput} from "./MethodInput.tsx";
import {AddrName} from "./AddrName.tsx";
import {MethodOutput} from "./MethodOutput.tsx";
import {AbiFunctionViewer} from "./AbiFunctionViewer.tsx";
import {fakeDataErr} from "./fakeDataErr.ts";
import {useState} from "react";
import {traceContext} from "./Tracer.tsx";

export const TraceView = () => {
    const columns: ColumnsType<ITrace> = [
        {title: 'Index', dataIndex: 'id', key: 'index', },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (_, record: ITrace) => {
                return (
                    <Space>
                        {record.depthPrefix}
                        {record.action.callType || record.action.createType}
                        <span style={{color: 'red'}}>{record.error}</span>
                    </Space>
                )
            }
        },
        // Table.EXPAND_COLUMN,
        {
            title: 'From',
            dataIndex: 'from',
            key: 'from',
            render: (_, record: ITrace) => {
                return <AddrName addr={record.action.from}/>
            }
        },
        {
            title: 'To', dataIndex: 'to', key: 'to', render: (_, record: ITrace) => {
                return <AddrName addr={record.action.to ||record.result.address}/>
            }
        },
        {
            title: 'Gas', dataIndex: 'gas', key: 'gas', render: (_, record: ITrace) => {
                return parseInt(record.result?.gasUsed).toLocaleString('en-US') + ' / ' + parseInt(record.action.gas).toLocaleString('en-US')
            }
        },
        {
            title: 'value', dataIndex: 'value', key: 'value', render: (_, record: ITrace) => {
                return formatEther(record.action.value)
            }
        },
        {
            title: 'abiDecoded', key: 'abiDecoded', render: (_, record: ITrace) => {
                return (
                    record.id>=0 ? <AbiFunctionViewer record={record}/> : 'hide dev'
                )
            }
        },
    ];
    const _data: ITrace[] = []//[buildTree(fakeData.result)]
    const [data, setData] = useState(_data)
    traceContext.setTrace = (res)=>setData(res.length ? [buildTree(res)] : [])
    return (
        <>
            <Table
                columns={columns}
                // rowSelection={{ ...rowSelection, checkStrictly }}
                dataSource={data}
                pagination={false}
                expandable={{
                    defaultExpandAllRows: true,
                    // expandedRowRender: (record) => <p style={{ margin: 0 }}>Output: {record.result?.output}</p>,
                }}
            />
        </>
    )
}