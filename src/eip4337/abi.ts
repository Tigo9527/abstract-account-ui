import { BigNumberish, Contract, ethers } from 'ethers'

const abi = [
  'function safeMint(address _to)', // erc721
  'function mint(address _to, uint256 _amount)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint amount)',
  'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external'
]

let contract: Contract

export const abiInterface = new ethers.utils.Interface(abi)

export function setupAbi (addr: string): void {
  contract = new ethers.Contract(addr, abi)
}

export function encodeMint (to: string, amt: BigNumberish): string {
  return contract.interface.encodeFunctionData('mint', [to, amt])
}

export function encodeApprove (spender: string, amt: BigNumberish): string {
  return contract.interface.encodeFunctionData('approve', [spender, amt])
}

export function encodeTransfer (to: string, amt: BigNumberish): string {
  return contract.interface.encodeFunctionData('transfer', [to, amt])
}
