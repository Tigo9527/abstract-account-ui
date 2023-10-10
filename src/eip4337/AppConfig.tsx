import {Button, Modal, Space, Spin} from "antd";
import {useCallback, useEffect, useState} from "react";
import {Contract, ContractFactory, Signer, utils} from "ethers";
import {paymaster_abi, paymaster_bytecode} from "./paymasterABI.ts";
import {EIP4337} from "./conf.ts";
import {Addr} from "../component/Addr.tsx";
import {formatEther, parseEther} from "ethers/lib/utils";
import {BigNumber, constants} from "ethers/lib.esm";
import {ReloadOutlined} from "@ant-design/icons";

export function AppConfig({signer}: { signer: Signer }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    // ----- paymaster ----
    const [deployPaymasterTx, setDeployPaymasterTx] = useState('')
    const [paymasterAddr, setPaymasterAddr] = useState('')
    const [deploying, setDeploying] = useState(false)
    const [depositV, setDepositV] = useState(BigNumber.from(0))

    const paymasterContract = new Contract(constants.AddressZero, paymaster_abi, EIP4337.provider)
    const getDeposit = useCallback(() => {
        return paymasterContract.attach(paymasterAddr).getDeposit().then((res: BigNumber) => {
            console.log(`new balance`, formatEther(res))
            setDepositV(res)
        })
    }, [paymasterAddr])

    const deposit = useCallback(() => {
        setDeploying(true)
        const abi = new utils.Interface(paymaster_abi)
        signer.sendTransaction({
            to: paymasterAddr,
            data: abi.getSighash('deposit'),
            value: parseEther('1')
        }).then(tx => tx.wait())
            .then(getDeposit)
            .finally(() => setDeploying(false))
    }, [paymasterAddr, signer])

    useEffect(() => {
        if (!paymasterAddr) {
            return
        }
        localStorage.setItem('paymaster_addr', paymasterAddr || '');
        getDeposit()
    }, [paymasterAddr])

    useEffect(() => {
        if (!signer) {
            return
        }
        const str = localStorage.getItem('paymaster_addr');
        console.log(`paymaster_addr at local storage [${str}]`)
        if (str) {
            const paymaster = new Contract(str, paymaster_abi, signer)
            Promise.all([
                paymaster.verifyingSigner(),
                signer.getAddress()
            ]).then(([owner, cur]) => {
                console.log(`check saved paymaster's owner: ${owner} vs current signer ${cur}`)
                return cur === owner
            }).then((eq: boolean) => {
                if (!eq) {
                    // force clear
                    localStorage.setItem('paymaster_addr', '');
                    setPaymasterAddr('')
                }
            }).catch((e: Error) => {
                console.log(`check paymaster addr error:`, e)
            })
        }
        setPaymasterAddr(str || '')
    }, [signer])

    const deployPaymaster = useCallback(() => {
        setDeploying(true)
        const factory = new ContractFactory(paymaster_abi, paymaster_bytecode, signer);
        signer.getAddress().then(signerAddr => {
            return factory.deploy(EIP4337.entryPoint["71"], signerAddr)
        }).then(tx => {
            setDeployPaymasterTx(tx.deployTransaction.hash)
            return tx.deployTransaction.wait()
        }).then(rcpt => {
            setPaymasterAddr(rcpt.contractAddress)
        }).catch(e => {
            console.log(`failed to deploy`, e)
        }).finally(() => {
            setDeploying(false)
        })
    }, [signer])
    // ----- paymaster ----
    return (
        <div style={{display: 'inline', height: 0}}>
            <div style={{position: 'relative', marginTop: '-30px', textAlign: 'right'}}>
                <Button type={'link'} onClick={showModal}>Settings</Button>
            </div>

            <Modal title="Paymaster" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <section>
                    <div>Paymaster: {(paymasterAddr ? <Addr addr={paymasterAddr}/> : '') || 'Not Set'}</div>
                    {paymasterAddr &&
                        <Space style={{marginRight: '8px'}}>
                            Balance: {formatEther(depositV)}
                            <Button size={'small'} type={'text'} onClick={getDeposit}><ReloadOutlined/></Button>
                            {!deploying && <Button onClick={deposit}>Deposit</Button>}
                        </Space>
                    }
                    {deploying && <Spin/>}
                    {deployPaymasterTx &&
                        <div>Deployment Tx: <a href={`https://evmtestnet.confluxscan.io/tx/${deployPaymasterTx}`}
                                               target={'_blank'}>{deployPaymasterTx}</a></div>}
                    {!paymasterAddr && !deploying &&
                        <div><Button onClick={deployPaymaster} type={'primary'}>Deploy</Button></div>}
                </section>
            </Modal>
        </div>
    )
}