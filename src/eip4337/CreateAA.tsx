import {Button, Divider, Input, notification, Popover, Space, Spin, Switch} from "antd";
import {BigNumber, BytesLike, ethers} from "ethers";
import {useCallback, useEffect, useState} from "react";
import {Client, IUserOperationMiddlewareCtx, Presets} from "userop";
import {EIP4337} from "./conf.ts";
import {formatEther, parseEther} from "ethers/lib/utils";
import {Addr} from "../component/Addr.tsx";
import {buildDemoOperation} from "../logic/bizLogic.ts";
import {MultiOp} from "./operations/MultiOp.tsx";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import {rebuildAccountMiddlewares} from "./utils.ts";
export type OpsData = {destArr?: string[], fnArr?:string[]}
export function CreateAA({signer, accountFactory, initFn, signFn, client}: { signer: ethers.Signer,
    accountFactory?: string,
    client: Client
    signFn?: (ctx: IUserOperationMiddlewareCtx)=>Promise<void>,
    initFn?: (salt:string)=>Promise<{addr:string, initCode: BytesLike}> }) {
    const [api, contextHolder] = notification.useNotification();
    const [aaAddr, setAddr] = useState('')
    const [aaAddrB, setAddrB] = useState(BigNumber.from(0))
    const [salt, setSalt] = useState('')
    const [sa, setSA] = useState(null as Presets.Builder.SimpleAccount|null)
    const [txHash, setTxHash] = useState('')
    const [isSpin, setSpin] = useState(false)
    const [usePaymaster, setUsePaymaster] = useState(false)
    const [opsData, setOpsData] = useState<OpsData>({destArr: [], fnArr:[]})

    const [counter, setCounter] = useState(0)

    const nodeRpc = EIP4337.nodeRpc
    const sendOperation = useCallback( () => {
        if (!sa) {
            return
        }
        // console.log(`multiple op`, opsData);
        if (opsData) {
            // return;
        }
        setSpin(true);
        (async () => {
            const ok = await rebuildAccountMiddlewares(sa, signer, usePaymaster, signFn);
            if (!ok) {
                return
            }
            const stub = await client.sendUserOperation(buildDemoOperation(sa, opsData),
                {
                    // onBuild: (res)=>{
                    //     console.log(`built op`, res)
                    // }
                });
            api.info({type:'info', message: `Succeeded to send user operation`})
            setSpin(true)
            const rcpt = await stub.wait().finally(()=>setSpin(false))
            if (rcpt) {
                api.info({type:'info', message: `Succeeded to execute user operation, tx hash: ${rcpt.transactionHash}`})
                setTxHash(rcpt.transactionHash)
            }
            setCounter(Date.now())
        })().catch(e=>{
            api.error({type:'error', message: `Failed to send user operation: ${e}`})
            console.log('sendUserOperation', e)
        }).finally(()=>setSpin(false));
    }, [sa, salt, initFn, opsData, usePaymaster, signer])

    const sendFunds = useCallback(()=>{
        if (!aaAddr) {
            return
        }
        setSpin(true);
        signer.sendTransaction({to: aaAddr, value: parseEther("1")})
            .then(tx=>{
                api.info({message:'tx sent'})
                return tx.wait()
            }).then(()=>{
            api.info({message: 'tx finished'})
            setCounter(Date.now())
        }).finally(()=>setSpin(false))
    }, [aaAddr])

    useEffect(()=>{
        if (!aaAddr) {
            return
        }
        EIP4337.provider.getBalance(aaAddr).then(res=>{
            setAddrB(res)
        })
    }, [aaAddr, counter])

    useEffect(() => {
        if (salt) {
            return
        }
        signer.getAddress().then(setSalt)
    }, [signer])

    // init Simple account
    useEffect(() => {
        let isSubscribed = true;
        const cancel = ()=> {
            isSubscribed = false;
        }
        if (!signer || (!salt)) {
            return cancel
        }
        (async () => {
            const simpleAccount = await Presets.Builder.SimpleAccount.init(
                signer, // Any object compatible with ethers.Signer
                // config.rpcUrl
                nodeRpc, {
                    entryPoint: '0x7ad823a5ca21768a3d3041118bc6e981b0e4d5ee',
                    overrideBundlerRpc: EIP4337.bundlerRpc,
                    factory: accountFactory || EIP4337.accountFactory,
                    salt: salt.startsWith('0x') ? BigNumber.from(BigInt(salt)) : BigNumber.from(salt),
                },
            );
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
                simpleAccount.useDefaults({sender: addr})
                //console.log(`set sender to `, addr)
                simpleAccount.proxy = simpleAccount.proxy.attach(addr);
            }
            if (!isSubscribed) return
            setSA(simpleAccount);
            setAddr(simpleAccount.proxy.address)
            const b = await simpleAccount.proxy.provider.getBalance(simpleAccount.proxy.address)
            if (!isSubscribed) return
            setAddrB(b|| BigNumber.from(0))
        })().catch(e => {
            setAddr(`error get sender ${e}`)
        });
        return cancel//cancel update
    }, [salt, signer, initFn])

    return (
        <>
            {contextHolder}
            <Space direction={'vertical'} style={{textAlign: 'left'}}>
                <Space>
                    <>Salt: <Input style={{width: '600px'}} value={salt.toString()}
                                   onChange={(v) => {
                                       const value = v.target.value;
                                       if (value.match(/(^\d+$)|(^(0x)?[a-fA-F0-9]*)/)) {
                                           setSalt(value)
                                       }
                                   }}/></>
                </Space>
                <Space>
                    <>Sender: <Addr counter={counter} addr={aaAddr} checkCode={true}/></>
                </Space>
                <Space>
                    <>Balance: {formatEther(aaAddrB)}</>
                    <Popover content={'Send funds(gas) to this account'}>
                        <Button onClick={sendFunds} type={aaAddrB.lte(parseEther("0.1")) && !usePaymaster ? 'primary' : 'dashed'}>Fund</Button>
                    </Popover>
                </Space>
                <Space>
                    Use verifying paymaster:
                    <Switch checked={usePaymaster}
                               checkedChildren={<CheckOutlined />}
                               unCheckedChildren={<CloseOutlined />}
                             onChange={(checked, ) => {
                                 const str = localStorage.getItem('paymaster_addr');
                                 if (!str) {
                                     api.error({type: 'error', message: `Paymaster not set, set it at [settings] panel.`})
                                     return
                                 }
                                 setUsePaymaster(checked);
                             }
                             }/>
                </Space>
                <Divider orientationMargin={0} orientation={'left'}>Operation(s)</Divider>
                {aaAddr && <MultiOp opReceiver={setOpsData} defaultAddr={aaAddr}/>}
                <Space>
                    <Popover content={(aaAddrB.lt(parseEther("0.1")) && !usePaymaster) ? 'Fund it first' : ''}>
                    {(!isSpin) && <Button
                        disabled={(aaAddrB.lt(parseEther("0.1")) && !usePaymaster) || !(opsData.fnArr?.length ?? 0)}
                        onClick={sendOperation} type={'primary'}>Send Operation</Button>}
                    {isSpin && <Spin/>}
                    </Popover>
                </Space>
                {txHash && <div>Transaction:</div>}
                <a href={`https://evmtestnet.confluxscan.io/tx/${txHash}`} target={'_blank'}>{txHash}</a>
            </Space>
            <div style={{width:'500px', display:'none', // -------- debug , hidden -----
                overflowWrap: 'anywhere'
            }}>
                {sa?.getInitCode()?.toString() || '?'}
            </div>
        </>
    )
}