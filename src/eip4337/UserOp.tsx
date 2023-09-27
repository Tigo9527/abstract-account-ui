import {Card, Tabs} from "antd";
import {CreateAA} from "./CreateAA.tsx";
import {ethers} from "ethers/lib.esm";
import {setupAbi} from "./abi.ts";
import {RsaAccount} from "./RsaAccount.tsx";
import {useEffect, useState} from "react";
import {Client} from "userop";
import {EIP4337} from "./conf.ts";
// import {ethers} from "ethers";
// import {EIP4337} from "./conf.ts";
// import * as abiEntryPoint from "./IEntryPoint.json"

export function UserOp({signer}: { signer: ethers.Signer }) {
    const [client, setClient] = useState(null as Client|null)
    setupAbi(ethers.constants.AddressZero)
    useEffect(()=>{
        (async ()=>{
            const nodeRpc = EIP4337.nodeRpc
            const client_ = await Client.init(nodeRpc, {
                entryPoint: EIP4337.entryPoint['71'],
                overrideBundlerRpc: EIP4337.bundlerRpc,
            });
            setClient(client_)
        })()
    }, [])
    if (!client) {
        return null
    }
    return (
        <Card>
            <Tabs
                type="card"
                defaultValue={'k2'}
                items={[
                    {label: 'Simple Account', key: 'k1', children:
                            <CreateAA client={client} signer={signer}/>},
                    {label: 'Rsa Account', key: 'k2', children:
                            <RsaAccount client={client} signer={signer}/>},
                ]}
            />
        </Card>
    );
}