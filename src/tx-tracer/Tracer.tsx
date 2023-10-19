import {Space} from "antd";
import {TxInput} from "./TxInput.tsx";
import {TraceView} from "./TraceView.tsx";

export const traceContext = {
    setTrace: (rpcRet:any)=>{
        console.log(`rpc result is `, rpcRet)}
}

export const Tracer = ()=>{
    return (
        <Space direction={'vertical'} style={{width: '100%'}}>
            Tracer
            <TxInput/>
            <TraceView/>
        </Space>
    )
}