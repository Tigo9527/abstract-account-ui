import {Card, Tabs} from "antd";
import {CreateAA} from "./CreateAA.tsx";
import {ethers} from "ethers/lib.esm";
import {setupAbi} from "./abi.ts";
import {RsaAccount} from "./RsaAccount.tsx";
// import {ethers} from "ethers";
// import {EIP4337} from "./conf.ts";
// import * as abiEntryPoint from "./IEntryPoint.json"

export function UserOp({signer}: { signer: ethers.Signer }) {
    setupAbi(ethers.constants.AddressZero)
    return (
        <Card>
            <Tabs
                type="card"
                defaultValue={'k2'}
                items={[
                    {label: 'Simple Account', key: 'k1', children: <CreateAA signer={signer}/>},
                    {label: 'Rsa Account', key: 'k2', children: <RsaAccount signer={signer}/>},
                ]}
            />
        </Card>
    )
}