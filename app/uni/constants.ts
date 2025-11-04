import { arbitrum, base, bsc } from 'viem/chains'

export const UNI_V4 = {
  [base.id]: {
    StateViewer: '0xa3c0c9b65bad0b08107aa264b0f3db444b867a71' as `0x${string}`,
    PoolManager: '0x498581ff718922c3f8e6a244956af099b2652b2b' as `0x${string}`,
    Quoter: '0x0d5e0f971ed27fbff6c2837bf31316121532048d' as `0x${string}`,
    UniversalRouter: '0x6ff5693b99212da76ad316178a184ab56d299b43' as `0x${string}`,
  },
  [arbitrum.id]: {
    StateViewer: '0x76fd297e2d437cd7f76d50f01afe6160f86e9990' as `0x${string}`,
    PoolManager: '0x360e68faccca8ca495c1b759fd9eee466db9fb32' as `0x${string}`,
    Quoter: '0x3972c00f7ed4885e145823eb7c655375d275a1c5' as `0x${string}`,
    UniversalRouter: '0xa51afafe0263b40edaef0df8781ea9aa03e381a3' as `0x${string}`,
  },
  [bsc.id]: {
    StateViewer: '0x1906c1d672b88cd1b9ac7593301ca990f94eae07' as `0x${string}`,
    PoolManager: '0x28e2ea090877bf75740558f6bfb36a5ffee9e9df' as `0x${string}`,
    Quoter: '0x9f75dd27d6664c475b90e105573e550ff69437b0' as `0x${string}`,
    UniversalRouter: '0x1906c1d672b88cd1b9ac7593301ca990f94eae07' as `0x${string}`,
  },
}

export const POOL_MANAGER_ABI = [
  {
    name: 'getSlot0',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'bytes32' }],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'protocolFee', type: 'uint24' },
      { name: 'lpFee', type: 'uint24' },
    ],
  },
  {
    name: 'getLiquidity',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'bytes32' }],
    outputs: [{ name: 'liquidity', type: 'uint128' }],
  },
] as const

export const QUOTER_V4_ABI = [
  {
    inputs: [
      {
        internalType: 'contract IPoolManager',
        name: '_poolManager',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'PoolId',
        name: 'poolId',
        type: 'bytes32',
      },
    ],
    name: 'NotEnoughLiquidity',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotPoolManager',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotSelf',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'QuoteSwap',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnexpectedCallSuccess',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'revertData',
        type: 'bytes',
      },
    ],
    name: 'UnexpectedRevertBytes',
    type: 'error',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'Currency',
            name: 'exactCurrency',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'Currency',
                name: 'intermediateCurrency',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
              {
                internalType: 'bytes',
                name: 'hookData',
                type: 'bytes',
              },
            ],
            internalType: 'struct PathKey[]',
            name: 'path',
            type: 'tuple[]',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: '_quoteExactInput',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'Currency',
                name: 'currency0',
                type: 'address',
              },
              {
                internalType: 'Currency',
                name: 'currency1',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
            ],
            internalType: 'struct PoolKey',
            name: 'poolKey',
            type: 'tuple',
          },
          {
            internalType: 'bool',
            name: 'zeroForOne',
            type: 'bool',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: '_quoteExactInputSingle',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'Currency',
            name: 'exactCurrency',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'Currency',
                name: 'intermediateCurrency',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
              {
                internalType: 'bytes',
                name: 'hookData',
                type: 'bytes',
              },
            ],
            internalType: 'struct PathKey[]',
            name: 'path',
            type: 'tuple[]',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: '_quoteExactOutput',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'Currency',
                name: 'currency0',
                type: 'address',
              },
              {
                internalType: 'Currency',
                name: 'currency1',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
            ],
            internalType: 'struct PoolKey',
            name: 'poolKey',
            type: 'tuple',
          },
          {
            internalType: 'bool',
            name: 'zeroForOne',
            type: 'bool',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: '_quoteExactOutputSingle',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'poolManager',
    outputs: [
      {
        internalType: 'contract IPoolManager',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'Currency',
            name: 'exactCurrency',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'Currency',
                name: 'intermediateCurrency',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
              {
                internalType: 'bytes',
                name: 'hookData',
                type: 'bytes',
              },
            ],
            internalType: 'struct PathKey[]',
            name: 'path',
            type: 'tuple[]',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactInput',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'gasEstimate',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'Currency',
                name: 'currency0',
                type: 'address',
              },
              {
                internalType: 'Currency',
                name: 'currency1',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
            ],
            internalType: 'struct PoolKey',
            name: 'poolKey',
            type: 'tuple',
          },
          {
            internalType: 'bool',
            name: 'zeroForOne',
            type: 'bool',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'gasEstimate',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'Currency',
            name: 'exactCurrency',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'Currency',
                name: 'intermediateCurrency',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
              {
                internalType: 'bytes',
                name: 'hookData',
                type: 'bytes',
              },
            ],
            internalType: 'struct PathKey[]',
            name: 'path',
            type: 'tuple[]',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactOutput',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'gasEstimate',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'Currency',
                name: 'currency0',
                type: 'address',
              },
              {
                internalType: 'Currency',
                name: 'currency1',
                type: 'address',
              },
              {
                internalType: 'uint24',
                name: 'fee',
                type: 'uint24',
              },
              {
                internalType: 'int24',
                name: 'tickSpacing',
                type: 'int24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
            ],
            internalType: 'struct PoolKey',
            name: 'poolKey',
            type: 'tuple',
          },
          {
            internalType: 'bool',
            name: 'zeroForOne',
            type: 'bool',
          },
          {
            internalType: 'uint128',
            name: 'exactAmount',
            type: 'uint128',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IV4Quoter.QuoteExactSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactOutputSingle',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'gasEstimate',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'unlockCallback',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
