import {BytesLike, ethers} from "ethers";
import {Button, Popover, Space} from "antd";
import {base64ToBytes, Base64urlUInt, buf2hex, genRsa, initRsaAccountSdk, loadKeyPair} from "../logic/bizLogic.ts";
import {useCallback, useEffect, useState} from "react";
import {CreateAA} from "./CreateAA.tsx";
import {IUserOperationMiddlewareCtx} from "userop";

export function RsaAccount({signer}: { signer: ethers.Signer }) {
    const [keyPair, setKeyPair] =
        useState({} as {privateKey?: CryptoKey, publicKey?: {n: string}});
    const generate = ()=>{
        genRsa('rsa').then(loadKey)
    }

    const loadKey = useCallback( () => {
        loadKeyPair('rsa').then(res => {
            console.log(`load again`, res)
            res && setKeyPair(res)
        })
    }, [])

    useEffect(()=>{
        loadKey();
    }, [])

    const buildInitCodeFn = useCallback((salt:string): Promise<{ addr: string, initCode: BytesLike }>=>{
        if (!keyPair.publicKey) {
            return Promise.resolve({addr:'', initCode: '0x'})
        }
        const n = buf2hex(base64ToBytes(Base64urlUInt(keyPair.publicKey!.n)));
        const exponent = '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001'
        return initRsaAccountSdk(exponent, n, salt)
    }, [keyPair])
    const signFn = useCallback(async (ctx: IUserOperationMiddlewareCtx)=>{
        console.log(`rsa sign`)
        // keyPair.privateKey.sign(ctx.getUserOpHash())
        ctx.op.signature = await window.crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            keyPair.privateKey!,
            ethers.utils.arrayify(ctx.getUserOpHash())
        ).then(buf2hex);
    }, [keyPair])

    return (
        <Space direction={'vertical'} style={{textAlign: 'left'}}>
            <Space>
                <>Public key: {keyPair.publicKey?.n.substring(0, 16).concat('...') || '-'}</>
                <Popover
                    overlayStyle={{maxWidth: '300px'}}
                    content={'Generate a random RSA keypair. The private key will be used to sign the `UserOpHash`.'}>
                    <Button onClick={generate}>Generate</Button>
                </Popover>
            </Space>
            <CreateAA
                initFn={buildInitCodeFn}
                signFn={signFn}
                signer={signer}/>
        </Space>
    )
}