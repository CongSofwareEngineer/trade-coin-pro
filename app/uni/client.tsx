// 'use client'
// import React, { useTransition } from 'react'
// import { Address, createPublicClient, formatUnits, getAddress, getContract, http, parseUnits } from 'viem'
// import { base } from 'viem/chains'
// import { computePoolAddress, Pool } from '@uniswap/v3-sdk'
// import { Percent, Token } from '@uniswap/sdk-core'
// import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
// import { Route } from '@uniswap/v3-sdk'
// import { SwapQuoter } from '@uniswap/v3-sdk'
// import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
// import { SwapOptionsSwapRouter02, SwapType, AlphaRouter } from '@uniswap/smart-order-router'

// const client = createPublicClient({
//   chain: base,
//   transport: http('https://base-rpc.publicnode.com'),
// })

// export const QUOTER_V2_ABI = [
//   {
//     name: 'quoteExactInputSingle',
//     type: 'function',
//     stateMutability: 'nonpayable',
//     inputs: [
//       {
//         components: [
//           { name: 'tokenIn', type: 'address', internalType: 'address' },
//           { name: 'tokenOut', type: 'address', internalType: 'address' },
//           { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
//           { name: 'fee', type: 'uint24', internalType: 'uint24' },
//           { name: 'sqrtPriceLimitX96', type: 'uint160', internalType: 'uint160' },
//         ],
//         name: 'params',
//         type: 'tuple',
//         internalType: 'struct IQuoterV2.QuoteExactInputSingleParams',
//       },
//     ],
//     outputs: [
//       { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
//       { name: 'sqrtPriceX96After', type: 'uint160', internalType: 'uint160' },
//       { name: 'initializedTicksCrossed', type: 'uint32', internalType: 'uint32' },
//       { name: 'gasEstimate', type: 'uint256', internalType: 'uint256' },
//     ],
//   },
//   {
//     inputs: [
//       {
//         components: [
//           {
//             internalType: 'address',
//             name: 'tokenIn',
//             type: 'address',
//           },
//           {
//             internalType: 'address',
//             name: 'tokenOut',
//             type: 'address',
//           },
//           {
//             internalType: 'uint256',
//             name: 'amount',
//             type: 'uint256',
//           },
//           {
//             internalType: 'uint24',
//             name: 'fee',
//             type: 'uint24',
//           },
//           {
//             internalType: 'uint160',
//             name: 'sqrtPriceLimitX96',
//             type: 'uint160',
//           },
//         ],
//         internalType: 'struct IQuoterV2.QuoteExactOutputSingleParams',
//         name: 'params',
//         type: 'tuple',
//       },
//     ],
//     name: 'quoteExactOutputSingle',
//     outputs: [
//       {
//         internalType: 'uint256',
//         name: 'amountIn',
//         type: 'uint256',
//       },
//       {
//         internalType: 'uint160',
//         name: 'sqrtPriceX96After',
//         type: 'uint160',
//       },
//       {
//         internalType: 'uint32',
//         name: 'initializedTicksCrossed',
//         type: 'uint32',
//       },
//       {
//         internalType: 'uint256',
//         name: 'gasEstimate',
//         type: 'uint256',
//       },
//     ],
//     stateMutability: 'nonpayable',
//     type: 'function',
//   },
// ] as const

// function UniScreen() {
//   const [isPending, startTransition] = useTransition()

//   function fromReadableAmount(amount: number, decimals: number): any {
//     return parseUnits(amount.toFixed(), decimals)
//   }

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   function toReadableAmount(rawAmount: bigint, decimals: number): string {
//     return formatUnits(rawAmount, decimals).slice(0, 4)
//   }

//   const getPoolInfo = async () => {
//     try {
//       const factoryAddress = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD'

//       const tokenWETH = '0x4200000000000000000000000000000000000006'
//       const tokenUSDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

//       // Create tokens with proper ordering
//       const token0 = new Token(base.id, getAddress(tokenUSDC), 6, 'USDC', 'USD Coin')
//       const token1 = new Token(base.id, getAddress(tokenWETH), 18, 'WETH', 'Wrapped Ether')

//       const currentPoolAddress = computePoolAddress({
//         factoryAddress: factoryAddress,
//         tokenA: token0,
//         tokenB: token1,
//         fee: 3000,
//       })

//       const poolContract = getContract({
//         address: currentPoolAddress as `0x${string}`,
//         abi: IUniswapV3PoolABI.abi,
//         client,
//       })

//       const [poolToken0, poolToken1, fee, liquidity, slot0] = (await Promise.all([
//         poolContract.read.token0(),
//         poolContract.read.token1(),
//         poolContract.read.fee(),
//         poolContract.read.liquidity(),
//         poolContract.read.slot0(),
//       ])) as [Address, Address, number, number, [bigint, number, number, number, number, number, number]]

//       return {
//         token0: poolToken0,
//         token1: poolToken1,
//         fee,
//         slot0,
//         liquidity,
//         currentPoolAddress,
//       }
//     } catch (error) {
//       console.error('Error getting pool info:', error)

//       return null
//     }
//   }

//   const getQuotedAmountOut = async () => {
//     try {
//       const quoterV2Address = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'

//       const poolInfo = await getPoolInfo()

//       if (!poolInfo) {
//         throw new Error('Failed to get pool info')
//       }

//       console.log({ poolInfo })

//       // For quoteExactInputSingle, we need:
//       // tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96
//       const amountIn = fromReadableAmount(1, 6) // 1 USDC

//       const quoterResult: [bigint, bigint, number, number] = await client.readContract({
//         address: getAddress(quoterV2Address) as `0x${string}`,
//         abi: QUOTER_V2_ABI,
//         functionName: 'quoteExactInputSingle',
//         args: [
//           {
//             tokenIn: getAddress(poolInfo.token1 as string), // tokenIn (USDC)
//             tokenOut: getAddress(poolInfo.token0 as string), // tokenOut (WETH)
//             fee: poolInfo.fee, // fee
//             amountIn: amountIn, // amountIn
//             sqrtPriceLimitX96: BigInt(0), // sqrtPriceLimitX96 (0 = no limit)
//             // sqrtPriceLimitX96: BigInt(poolInfo.slot0[0] as any), // sqrtPriceLimitX96 (0 = no limit)
//           },
//         ],
//       })

//       console.log('Quote result:', quoterResult)
//       const options: SwapOptionsSwapRouter02 = {
//         recipient: '0x4200000000000000000000000000000000000006',
//         slippageTolerance: new Percent(50, 10_000),
//         deadline: Math.floor(Date.now() / 1000 + 1800),
//         type: SwapType.SWAP_ROUTER_02,
//       }

//       const router = new AlphaRouter({
//         chainId: base.id,
//         provider: client,
//       })

//       console.log({ options })

//       const tokenWETH = new Token(base.id, getAddress('0x4200000000000000000000000000000000000006'), 18, 'WETH', 'Wrapped Ether')
//       const tokenUSDC = new Token(base.id, getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'), 6, 'USDC', 'USD Coin')

//       const pool = new Pool(
//         tokenUSDC,
//         tokenWETH,
//         poolInfo.fee,
//         poolInfo.slot0[0].toString(),
//         poolInfo.liquidity.toString(),
//         poolInfo.slot0[1] // tick
//       )

//       const swapRoute = new Route([pool], tokenUSDC, tokenWETH)

//       console.log({ swapRoute })

//       const { calldata } = SwapQuoter.quoteCallParameters(
//         swapRoute,
//         CurrencyAmount.fromRawAmount(tokenUSDC, fromReadableAmount(1, tokenUSDC.decimals).toString()),
//         TradeType.EXACT_INPUT,
//         {
//           useQuoterV2: true,
//         }
//       )

//       console.log({ calldata })

//       return quoterResult
//     } catch (error) {
//       console.error('Error getting quote:', error)
//       console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')

//       return null
//     }
//   }

//   const getData = async () => {
//     startTransition(async () => {
//       const quotedAmountOut = await getQuotedAmountOut()

//       console.log({ quotedAmountOut })
//     })
//   }

//   return (
//     <div>
//       <button
//         className={`${isPending ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} bg-gray-800 p-5 rounded-xl`}
//         disabled={isPending}
//         onClick={getData}
//       >
//         Uni Page
//       </button>
//     </div>
//   )
// }

// export default UniScreen

import React from 'react'

function UniScreen() {
  return <div>UniScreen</div>
}

export default UniScreen
