import {useEffect, useState} from "react";
import {fetchJson} from "ethers/lib/utils";
import {storageConf} from "./conf.ts";

export const FileInfo = ({hash, setId}: { hash: string | number, setId: (id: string | undefined) => void }) => {
    const [storageRet, setStorageRet] = useState<any>({})
    useEffect(() => {
        const input = hash.toString();
        setStorageRet('')
        if (!input) {
            setId(undefined);
            setStorageRet('')
            return
        }
        let isId = false;
        if (/^\d+$/.test(input)) {
            setId(input)
            isId = true;
        }
        fetchJson(`${storageConf.storage}`, JSON.stringify({
            params: [isId ? parseInt(input) : input],
            method: isId ? 'nrhv_getFileInfoByTxSeq' : 'nrhv_getFileInfo',
            "id": Date.now(),
            "jsonrpc": "2.0"
        })).then(res => {
            setStorageRet(res)
            setId(res.result?.tx?.seq)
        });
    }, [hash, setId])
    return (
        <>
            {storageRet && <div style={{textAlign: 'left'}}>
                Storage RPC result: (finalized {storageRet.result?.finalized?.toString() || '-'})
                <pre>{JSON.stringify(storageRet, null, 4)}</pre>
            </div>}
        </>
    )
}