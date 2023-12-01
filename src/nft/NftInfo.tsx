import {useEffect, useMemo, useState} from "react";
import {ethers} from "ethers/lib.esm";
import {Space} from "antd";
import {BigNumberish} from "ethers";
import {MetaView} from "./MetaView.tsx";
import {ControlPanel} from "./ControlPanel.tsx";
import {decode, isValidCfxAddress, isValidHexAddress} from "@conflux-dev/conflux-address-js"
import {formatCallException} from "../logic/utils.ts";

export type NftInfoParam = {
    addr?: string,
    rpcUrl?: string,
}
export type TokenInfo = {
    name: string, symbol: string, totalSupply: string, firstTokenId: BigNumberish | null,
    is721: boolean, is1155: boolean,
    error: string
}
export const NftInfo = ({addr, rpcUrl}:NftInfoParam) => {
    const [v, setV] = useState<Partial<TokenInfo>>({})
    const erc = useMemo(()=>{
        return v?.is721 ? "721" : v?.is1155 ? "1155" : "unknown"
    }, [v])
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
        let hex: string;
        if (isValidHexAddress(addr)) {
            hex = addr
        } else if (isValidCfxAddress(addr)) {
            hex = ethers.utils.hexlify(decode(addr).hexAddress)
        } else {
            setV({error: 'invalid contract address'})
            return undefined
        }
        const abi = [
            "function name() view returns (string memory)",
            "function symbol() view returns (string memory)",
            "function supportsInterface(bytes4 interfaceId) view returns (bool)",
            "function uri(uint id) view returns (string memory)",
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
        setV({error: '', is721: false, is1155: false})
        const ERC1155InterfaceId: string = "0xd9b67a26";
        const ERC721InterfaceId: string = "0x80ac58cd";
        Promise.allSettled([
            contract.name(),
            contract.symbol(),
            contract.totalSupply(),
            contract.tokenByIndex(0),
            contract.supportsInterface(ERC721InterfaceId),
            contract.supportsInterface(ERC1155InterfaceId),
        ]).then(([name, symbol, sup, tokenId, check721, check1155])=>{
            console.log(`721 ret`, check721, `1155 ret`, check1155)
            setV({
                name: name.status === 'fulfilled' ? name.value : formatCallException(name.reason),
                symbol: symbol.status === 'fulfilled' ? symbol.value : formatCallException(symbol.reason),
                totalSupply: sup.status === 'fulfilled' ? `${sup.value}` : formatCallException(sup.reason),
                firstTokenId: tokenId.status === 'fulfilled' ? tokenId.value : formatCallException(tokenId.reason)+":tokenByIndex",
                is721: check721.status === 'fulfilled' ? check721.value : false,
                is1155: check1155.status === 'fulfilled' ? check1155.value : false,
                error: ([name.status, symbol.status, sup.status, tokenId.status].find(o=>o==='rejected'))
                    ? "An error occurred. Please ensure that the contract exists on the selected chain and supports relevant functions." : ""
            })
        });
    }, [contract])
    return (
        <Space direction={'vertical'}>
            <div style={{display: 'flex', justifyContent: 'space-evenly', width: '800px'}}>
                <div>Name: {v.name}</div>
                <div>Symbol: {v.symbol}</div>
                <div>Total supply: {v.totalSupply}</div>
                <div>ERC: {erc}</div>
            </div>
            {v.error && <div style={{color: 'red', width: '800px'}}>{v.error} {v.is721 ? "721":""}</div>}
            {!v.error && contract && <ControlPanel addr={contract?.address} sampleId={v.firstTokenId} erc={erc}/>}
            {contract && Boolean(v.firstTokenId) &&
                <MetaView contract={contract} tokenId={v.firstTokenId!} erc={erc}/>
            }
        </Space>
    )
}