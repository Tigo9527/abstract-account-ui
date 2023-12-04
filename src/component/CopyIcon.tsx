import {CheckOutlined, CopyOutlined, } from "@ant-design/icons";
import {useState} from "react";

type Param = {
    content: string
}
export const CopyIcon = ({content}:Param) => {
    const [v, setV] = useState<boolean>(false)

    return (
        <>
            {v ? <span style={{color:'green'}}><CheckOutlined/></span> : <CopyOutlined  onClick={()=>{
                try {
                    navigator.clipboard.writeText(content)
                    setV(true)
                    setTimeout(()=>setV(false), 1_000)
                } catch (e) {
                    window.alert(`failed to write to clipboard`)
                }
            }}/>}
        </>
    )
}