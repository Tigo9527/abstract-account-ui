import {EIP4337} from "../eip4337/conf.ts";
import {abiInterface, encodeApprove, encodeMint, encodeTransfer} from "../eip4337/abi.ts";
import {parseEther} from "ethers/lib/utils";
import {BytesLike, ethers} from "ethers";
import {EntryPoint__factory} from "userop/dist/typechain";
import {Presets} from "userop";
import {OpsData} from "../eip4337/CreateAA.tsx";

export async function initRsaAccountSdk(
    _exponent: BytesLike, _modulus: BytesLike,
    salt: string
): Promise<{ addr: string, initCode: BytesLike }> {
    const entryPoint = EntryPoint__factory.connect(EIP4337.entryPoint["71"], EIP4337.provider)
    const abi = [
        'function createAccount(bytes memory _exponent, bytes memory _modulus, uint256 salt) public returns (address ret)'
    ]
    const coder = new ethers.utils.Interface(abi)
    const instance = {factory: {address: EIP4337.rsaFactory}};
    let addr: string|undefined = ethers.constants.AddressZero
    let initCode: BytesLike = '0x'
    try {
        initCode = ethers.utils.hexConcat([
            instance.factory.address,
            coder.encodeFunctionData("createAccount", [
                _exponent, _modulus,
                ethers.BigNumber.from(salt),
            ]),
        ]);
        console.log(`call to getSenderAddress`)
        await entryPoint.callStatic.getSenderAddress(initCode);

        throw new Error("getSenderAddress: unexpected result");
    } catch (error) {
        // console.log(` error is `, error)
        //
        addr = (error as {errorArgs:{sender?:string}})?.errorArgs?.sender;
        if (!addr) throw error;
    }
    return {addr, initCode}
}

export function buildDemoOperation(sa: Presets.Builder.SimpleAccount, opsInput?:OpsData) {
    console.log(`sender is `, sa.getSender())
    const destArr = opsInput?.destArr || [EIP4337.demoErc20 , EIP4337.demoErc20, EIP4337.demoErc20
    ];
    const funDataArr = opsInput?.fnArr || [
        encodeMint(sa.getSender(), parseEther('1')),
        encodeApprove(EIP4337.entryPoint["71"], parseEther('1')),
        encodeTransfer('0x'+'1'.padStart(40, '0'), parseEther('0.3'))
    ];
    return sa.setCallData(abiInterface.encodeFunctionData("executeBatch", [
            destArr,
            [],
            funDataArr
        ])).setPartial({
        preVerificationGas: 1_000_000, verificationGasLimit: 1900_000, callGasLimit: 1_000_000
    })
}

export function Base64urlUInt (input:string) {
    // Replace non-url compatible chars with base64 standard chars
    input = input
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    // Pad out with standard base64 required padding characters
    const pad = input.length % 4;
    if(pad) {
        if(pad === 1) {
            throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
        }
        input += new Array(5-pad).join('=');
    }

    return input;
}

export function buf2hex(buffer:ArrayBufferLike) { // buffer is an ArrayBuffer
    return '0x'+[...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

export function base64ToBytes(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function bytesToBase64(bytes: Uint8Array) {
    const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join("");
    return btoa(binString);
}

async function exportBase64(key: CryptoKey, saveTo: string) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    const str = bytesToBase64(new Uint8Array(exported))
    // console.log(`exported `, str)
    localStorage.setItem(saveTo, str)
    console.log(`saved to ${saveTo}`)
}

export async function saveKeyPair(keyPair: CryptoKeyPair, saveToPrefix: string) {
    const key = keyPair.privateKey;
    await exportBase64(key, saveToPrefix + ".private");
    // await exportBase64(keyPair.publicKey, saveToPrefix+".public");
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    const str = JSON.stringify(exported);
    // console.log(`public exported `, str)
    localStorage.setItem(saveToPrefix + '.public', str)
}

export async function loadKeyPair(saveToPrefix: string) {
    const str = localStorage.getItem(saveToPrefix + ".private")
    if (!str) {
        return null
    }
    const strPub = localStorage.getItem(saveToPrefix + ".public")
    if (!strPub) {
        return null
    }
    const privateKey = await window.crypto.subtle.importKey('pkcs8', base64ToBytes(str), algorithm, true, ['sign'])
    return {privateKey, publicKey: JSON.parse(strPub)}
}

const algorithm = {
    name: "RSASSA-PKCS1-v1_5",
    // Consider using a 4096-bit key for systems that require long-term security
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

export async function genRsa(saveToPrefix: string) {
    const keyPair = await window.crypto.subtle.generateKey(
        algorithm,
        true,
        ["sign", "verify"]
    );
    // console.log(`key pair`, keyPair, keyPair.privateKey.extractable)
    await saveKeyPair(keyPair, saveToPrefix).catch(console.log)
    return keyPair

    // const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    //     modulusLength: 2048,
    //     publicKeyEncoding: {
    //         type: 'pkcs1',
    //         format: 'pem'
    //     },
    //     privateKeyEncoding: {
    //         type: 'pkcs1',
    //         format: 'pem'
    //     }
    // })
}