import {Button, Input, Popover, Space} from "antd";
import {ethers} from "ethers";
import {useEffect, useState} from "react";
import {UserOp} from "./UserOp.tsx";
import Link from "antd/es/typography/Link";
import {Balance} from "../component/Balance.tsx";
import {EIP4337} from "./conf.ts";

export function Account() {
    const localPk = localStorage.getItem('pk') || ''
    const [pk, setPK] = useState(localPk)
    const [signer, setSigner] = useState(null as ethers.Signer | null)
    const [addr, setAddr] = useState('')
    const generate = ()=>{
        const rndWallet = ethers.Wallet.createRandom()
        const rndPk = rndWallet.privateKey
        pk && localStorage.setItem(`pk_${new Date().toISOString()}`, pk)
        setPK(rndPk)
    }
    useEffect(()=>{
        if (!pk) {
            return
        }
        localStorage.setItem(`pk`, pk)
        try {
            const wallet = new ethers.Wallet(pk, EIP4337.provider);
            setSigner(wallet)
            wallet.getAddress().then(res => setAddr(res))
        } catch (e) {
            setAddr(`invalid pk ${e}`)
        }
    },[pk])

    return (
        <Space direction={'vertical'} style={{border: '0px solid red'}}>
            <>Abstract Account Demo</>
            <Space>
                <Input style={{width:'600px'}} placeholder={'Private Key'}
                       onChange={(e)=>setPK(e.target.value)} value={pk}/>
                <Popover
                    overlayStyle={{maxWidth: '300px'}}
                    content={'Generate a random private key. \nIt will be used to send funds(gas) to ' +
                    'a abstract account, and sign user operation for a Simple Account. It should be replaced by a ' +
                    'wallet like metamask under production environment.'}>
                    <Button type={(pk) ? 'dashed':'primary'} onClick={generate}>Generate</Button>
                </Popover>
            </Space>
            <Space>
                <div>Address: {addr}</div>
                <Balance addr={addr}/>
                <Link href={'https://efaucet.confluxnetwork.org/'} target={'_blank'}>Faucet</Link>
            </Space>
            <Space direction={'vertical'} style={{width: '100%'}}>
                {signer && <UserOp signer={signer!}/>}
            </Space>
        </Space>
    )
}