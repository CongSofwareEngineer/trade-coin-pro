import { Currency, Token } from '@uniswap/sdk-core'
import { Address, Chain, createPublicClient, erc20Abi, Hash, http, zeroAddress } from 'viem'
import { base } from 'viem/chains'
import { Pool } from '@uniswap/v4-sdk'
import { NoTickDataProvider } from '@uniswap/v3-sdk'

import { POOL_MANAGER_ABI, QUOTER_V4_ABI, UNI_V4 } from './constants'
type PoolV4Key = {
  currency0: Currency
  currency1: Currency
  fee: number
  tickSpacing: number
  hooks: string
  zeroForOne: boolean
}

export interface PoolState {
  sqrtPriceX96: bigint
  tick: number
  protocolFee: number
  lpFee: number
  liquidity: bigint
  price: number
}

class PoolV4Web3 {
  static chainId = base.id
  static FEE_TIER_05 = 500 // 0.05%
  static TICK_SPACING_05 = 10 // Tick spacing for 0.05% fee tier

  static getChain(chainId?: number): Chain {
    return {
      ...base,
      rpcUrls: {
        default: { http: ['https://base-rpc.publicnode.com'] },
        // default: { http: ['https://nft.keyring.app/api/quickNodeRpc?chainType=base'] }
      },
    }
  }

  static getClient(chainId?: number) {
    const chainCurrent = this.getChain(chainId || this.chainId)
    const client = createPublicClient({
      batch: {
        multicall: true,
      },
      chain: chainCurrent,
      transport: http(chainCurrent.rpcUrls.default.http[0]),
      name: 'publicClient',
    })

    return client
  }

  static async getTokenInfo(address: `0x${string}`, chainId?: number) {
    try {
      const client = this.getClient(chainId)

      if (address === zeroAddress) {
        return new Token(chainId || this.chainId, zeroAddress, 18, 'ETH', 'Ethereum')
      }
      const contracts = [
        {
          abi: erc20Abi,
          address: address as Address,
          functionName: 'decimals',
        },
        {
          abi: erc20Abi,
          address: address as Address,
          functionName: 'symbol',
        },
        {
          abi: erc20Abi,
          address: address as Address,
          functionName: 'name',
        },
      ]

      const results: any = await client.multicall<unknown[]>({
        authorizationList: undefined,
        contracts: contracts as any[],
      })

      const token = new Token(chainId || this.chainId, address, Number(results[0].result), results[1].result, results[2].result)

      return token
    } catch (error) {
      console.error('Error fetching token info:', error)
      throw error
    }
  }

  static getContractPool(chainId?: number): {
    PoolManager: `0x${string}`
    Quoter: `0x${string}`
    UniversalRouter: `0x${string}`
    StateViewer: `0x${string}`
  } {
    return UNI_V4[(chainId || this.chainId) as keyof typeof UNI_V4]
  }

  static sortsBefore(tokenA: Token, tokenB: Token): boolean {
    if (tokenA.isNative) return true
    if (tokenB.isNative) return false

    return tokenA.sortsBefore(tokenB.wrapped)
  }

  static async createPoolKey(tokenA: Address, tokenB: Address, chainId?: number): Promise<PoolV4Key> {
    const [tokenAInfo, tokenBInfo] = await Promise.all([this.getTokenInfo(tokenA, chainId), this.getTokenInfo(tokenB, chainId)])

    const [currency0, currency1] = this.sortsBefore(tokenAInfo, tokenBInfo) ? [tokenAInfo, tokenBInfo] : [tokenBInfo, tokenAInfo]

    return {
      currency0,
      currency1,
      fee: this.FEE_TIER_05,
      tickSpacing: this.TICK_SPACING_05,
      hooks: zeroAddress,
      zeroForOne: this.sortsBefore(currency0 as Token, currency1 as Token),
    }
  }

  static calculatePoolId(poolKey: PoolV4Key): string {
    const { currency0, currency1, fee, tickSpacing, hooks } = poolKey
    const poolId = Pool.getPoolId(currency0, currency1, fee, tickSpacing, hooks)

    console.log('Pool ID calculated:', poolId)

    return poolId
  }

  static async getPoolState(poolKey: PoolV4Key, chainId?: number): Promise<PoolState> {
    const poolId = this.calculatePoolId(poolKey)
    const client = this.getClient(chainId)
    const { StateViewer } = this.getContractPool(chainId)
    const { currency0, currency1, fee, tickSpacing, hooks } = poolKey

    const arrCall = [
      {
        abi: POOL_MANAGER_ABI,
        address: StateViewer,
        functionName: 'getSlot0',
        args: [poolId as Hash],
      },
      {
        abi: POOL_MANAGER_ABI,
        address: StateViewer,
        functionName: 'getLiquidity',
        args: [poolId as Hash],
      },
    ]

    const [slot0Result, liquidityResult] = (await client.multicall({
      authorizationList: undefined,
      contracts: arrCall as any[],
    })) as Array<
      | {
          error?: undefined
          result: any
          status: 'success'
        }
      | {
          error: Error
          result?: undefined
          status: 'failure'
        }
    >

    const sqrtPriceX96 = slot0Result?.result[0] as bigint
    const tick = slot0Result?.result[1] as number
    const protocolFee = slot0Result?.result[2] as number
    const lpFee = slot0Result?.result[3] as number
    const liquidity = liquidityResult?.result as bigint

    const Q96 = Math.pow(2, 96)
    const sqrtPrice = Number(sqrtPriceX96) / Q96
    const price = sqrtPrice * sqrtPrice

    // Adjust for decimals
    const decimalAdjustment = Math.pow(10, currency1.decimals - currency0.decimals)
    const adjustedPrice = price / decimalAdjustment

    const poolState: PoolState = {
      sqrtPriceX96,
      tick,
      protocolFee,
      lpFee,
      liquidity,
      price: adjustedPrice,
    }

    return poolState
  }

  static async quotedAmountOut(pooKey: PoolV4Key, amountIn: bigint, chainId?: number) {
    const { Quoter } = this.getContractPool(chainId)
    const client = this.getClient(chainId)

    const poolKeyContract = {
      currency0: pooKey.currency0?.address,
      currency1: pooKey.currency1?.address,
      fee: pooKey.fee,
      tickSpacing: pooKey.tickSpacing,
      hooks: pooKey.hooks,
    }

    console.log({ poolKeyContract })
    //quoteExactOutputSingle khi usc->eth
    const res = await client.readContract({
      address: Quoter,
      abi: QUOTER_V4_ABI,
      // functionName: 'quoteExactInputSingle' :'quoteExactOutputSingle',
      functionName: 'quoteExactInputSingle',
      args: [
        {
          poolKey: poolKeyContract,
          zeroForOne: pooKey.zeroForOne,
          exactAmount: amountIn,
          hookData: pooKey.hooks,
        },
      ],
    })

    return res
  }

  static async createPoolInstance(poolKey: PoolV4Key, poolState: PoolState): Promise<Pool> {
    const NO_TICK_DATA_PROVIDER_DEFAULT = new NoTickDataProvider()

    return new Pool(
      poolKey.currency0,
      poolKey.currency1,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks,
      poolState.sqrtPriceX96.toString(),
      poolState.liquidity.toString(),
      poolState.tick,
      []
    )
  }
}

export default PoolV4Web3
