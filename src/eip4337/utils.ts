import {IUserOperationMiddlewareCtx} from "userop";
import {SimpleAccount} from "userop/dist/preset/builder";
import {BytesLike, Signer, utils} from "ethers";
import {EOASignature} from "userop/dist/preset/middleware";
import {arrayify, defaultAbiCoder, hexConcat} from "ethers/lib/utils";

export function signByPaymaster(signer: Signer, paymasterAddr: string) {
    return async (ctx: IUserOperationMiddlewareCtx)=>{
        const validUntil = Date.now();
        const validAfter = 0;
        const packed = utils.defaultAbiCoder.encode(
            [
                "address",
                "uint256",
                "bytes32",
                "bytes32",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "uint256","address",
                "uint48", "uint48",
            ],
            [
                ctx.op.sender,
                ctx.op.nonce,
                utils.keccak256(ctx.op.initCode),
                utils.keccak256(ctx.op.callData),
                ctx.op.callGasLimit,
                ctx.op.verificationGasLimit,
                ctx.op.preVerificationGas,
                ctx.op.maxFeePerGas,
                ctx.op.maxPriorityFeePerGas,
                71, paymasterAddr,
                validUntil, validAfter,
            ]
        );

        const hash = utils.keccak256(packed);
        const sig = await signer.signMessage(arrayify(hash))
        const paymasterAndData = hexConcat([
            paymasterAddr,
            defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]),
            sig
        ])

        ctx.op.paymasterAndData = paymasterAndData
    }
}

export async function rebuildAccountMiddlewares(simpleAccount: SimpleAccount,
                                                salt: string,
                                                signer: Signer, usePaymaster: boolean,
                                                initFn?: (salt:string)=>Promise<{addr:string, initCode: BytesLike}>,
                                                signFn?: (ctx: IUserOperationMiddlewareCtx)=>Promise<void>,): Promise<boolean> {
    if (initFn) {
        const {addr, initCode} = await initFn(salt)
        if (!addr) {
            return Promise.resolve(false)
        }
        // console.log(`previous init code`, simpleAccount.getInitCode().toString().substring(0, 100))
        // console.log(`use init fn result`, addr, initCode);
        simpleAccount['initCode'] = initCode
        // simpleAccount.setInitCode(initCode)
        simpleAccount.setSender(addr)
        simpleAccount.proxy = simpleAccount.proxy.attach(addr);
    }
        //
    const [resolveAccount, getGasPrice, /*_estimateUserOperationGas*/, /*EOASignature*/] = simpleAccount['middlewareStack']
    simpleAccount.resetMiddleware()
    simpleAccount.useMiddleware(resolveAccount)
    simpleAccount.useMiddleware(getGasPrice)

    if (usePaymaster) {
        const str = localStorage.getItem('paymaster_addr');
        if (!str) {
            throw new Error(`paymaster not set`)
        }
        simpleAccount.useMiddleware(signByPaymaster(signer, str));
    }
    simpleAccount.useMiddleware(signFn || EOASignature(signer))

    return Promise.resolve(true)
}