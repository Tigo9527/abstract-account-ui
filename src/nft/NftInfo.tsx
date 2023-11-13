import {useEffect, useMemo, useState} from "react";
import {ethers} from "ethers/lib.esm";
import {Space} from "antd";
import {BigNumberish} from "ethers";
import {MetaView} from "./MetaView.tsx";
import {ControlPanel} from "./ControlPanel.tsx";
import {decode, isValidCfxAddress} from "@conflux-dev/conflux-address-js"
import {formatCallException} from "../logic/utils.ts";

export type NftInfoParam = {
    addr?: string,
    rpcUrl?: string,
}
export type TokenInfo = {
    name: string, symbol: string, totalSupply: string, firstTokenId: BigNumberish | null,
    error: string
}
export const NftInfo = ({addr, rpcUrl}:NftInfoParam) => {
    const [v, setV] = useState<Partial<TokenInfo>>({})
    const provider = useMemo(()=>{
        if (!rpcUrl) {
            return
        }
        return ethers.getDefaultProvider(rpcUrl);
    }, [rpcUrl])
    const contract = useMemo(()=>{
        if (!addr || !provider) {
            return
        }
        const hex = addr.startsWith("0x") ? addr : '0x'+decode(addr).hexAddress.toString('hex')
        const abi = [
            "function name() view returns (string memory)",
            "function symbol() view returns (string memory)",
            "function tokenURI(uint id) view returns (string memory)",
            "function totalSupply() view returns (uint)",
            "function tokenByIndex(uint i) view returns (uint)",
        ];
        console.log(`use hex addr `, hex, 'isValidCfxAddress', isValidCfxAddress(addr))
        return new ethers.Contract(hex, abi, provider)
    }, [addr, provider])
    useEffect(()=>{
        if (!contract) {
            return
        }
        setV({error: ''})
        Promise.allSettled([
            contract.name(),
            contract.symbol(),
            contract.totalSupply(),
            contract.tokenByIndex(0),
        ]).then(([name, symbol, sup, tokenId])=>{
            setV({
                name: name.status === 'fulfilled' ? name.value : formatCallException(name.reason),
                symbol: symbol.status === 'fulfilled' ? symbol.value : formatCallException(symbol.reason),
                totalSupply: sup.status === 'fulfilled' ? `${sup.value}` : formatCallException(sup.reason),
                firstTokenId: tokenId.status === 'fulfilled' ? tokenId.value : formatCallException(tokenId.reason),
                error: ([name.status, symbol.status, sup.status, tokenId.status].find(o=>o==='rejected'))
                    ? "An error occurred. Please ensure that the contract exists on the selected chain and supports relevant functions." : ""
            })
        });
    }, [contract])
    return (
        <Space direction={'vertical'}>
            <div style={{display: 'flex', justifyContent: 'space-evenly', minWidth: '800px'}}>
                <div>Name: {v.name}</div>
                <div>Symbol: {v.symbol}</div>
                <div>Total supply: {v.totalSupply}</div>
            </div>
            {v.error && <div style={{color: 'red'}}>{v.error}</div>}
            <ControlPanel addr={contract?.address} sampleId={v.firstTokenId}/>
            {contract && Boolean(v.firstTokenId) &&
                <MetaView contract={contract} tokenId={v.firstTokenId!}/>
            }
        </Space>
    )
}