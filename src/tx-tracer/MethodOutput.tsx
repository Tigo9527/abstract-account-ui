import {Popover} from "antd";
import {useEffect, useState} from "react";

export const MethodOutput = ({input}: { input?: string, to?: string }) => {
    const [v, setV] = useState({text_signature: '', short: ''})

    useEffect(() => {
        if ((input?.length || 0) < 10) {
            return
        }
        if (input === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            setV({text_signature: '', short: '0x00'})
        } else if (input?.startsWith('0x000000000000000000000000') && input?.length === 66) {
            setV({text_signature: '', short: '0x' + input?.substr(-40)})
        }
    }, [input]);

    return (
        <>
            <Popover content={
                <div
                    style={{overflow: 'auto', maxWidth: '800px', maxHeight: '600px', wordWrap: 'break-word'}
                }>{v.short || input}</div>}>
                {/*{v.short || input?.substring(0,10)}*/}
                Out
            </Popover>
        </>
    )
}