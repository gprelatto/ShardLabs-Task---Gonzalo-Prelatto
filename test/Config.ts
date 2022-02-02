import { TokenInfo } from "./pool-utils/TokenInfo";
import { PoolType } from "./utils/TempusPool";

// Default list of all Pool Types that will be run during tests
export const ALL_POOLS = [
    PoolType.Aave,
    PoolType.Lido,
    PoolType.PoLido,
    PoolType.Compound,
    PoolType.Yearn,
    PoolType.Rari
];

// Set this to `PoolType.XXX` if you want to only run one specific pool's tests
const ONLY_RUN_POOL:PoolType = PoolType.PoLido;

// Set this to `aDAI` or `aUSDC` if you want to only run one specific YBT tests
const ONLY_YIELD_TOKEN:string = undefined;

// Is this an integration test run?
const RUN_INTEGRATION_TESTS:boolean = false;

const TOTAL_SUPPLY = 10000000000;

// pairs of [ASSET_TOKEN, YIELD_TOKEN] infos
// for standard unit tests which use mock protocols
const MOCK_TOKENS: { [type:string]: TokenInfo[][]; } = {
  "Aave": [
    [
      { decimals:18, name:"Dai Stablecoin", symbol:"DAI", totalSupply:TOTAL_SUPPLY },
      { decimals:18, name:"Aave interest bearing DAI", symbol:"aDAI" }
    ],
    [
      { decimals:6, name:"USD Coin", symbol:"USDC", totalSupply:TOTAL_SUPPLY },
      { decimals:6, name:"Aave interest bearing USDC", symbol:"aUSDC" } // similar to USDT
    ]
  ],
  "Compound": [
    [
      { decimals:18, name:"Dai Stablecoin", symbol:"DAI", totalSupply:TOTAL_SUPPLY },
      { decimals:8,  name:"Compound Dai", symbol:"cDAI" }
    ],
    [
      { decimals:6, name:"USD Coin", symbol:"USDC", totalSupply:TOTAL_SUPPLY },
      { decimals:8, name:"Compound USD Coin", symbol:"cUSDC" }
    ]
  ],
  "Lido": [
    [
      { decimals:18, name:"ETH Mock", symbol:"ETH", totalSupply:TOTAL_SUPPLY },
      { decimals:18, name:"Liquid staked Ether 2.0", symbol:"stETH" }
    ]
  ],
  "PoLido": [
    [
      { decimals:18, name:"MATIC Mock", symbol:"MATIC", totalSupply:TOTAL_SUPPLY },
      { decimals:18, name:"Liquid staked Matic", symbol:"stMATIC" }
    ]
  ], 
  "Yearn": [
    [
      { decimals:18, name:"Dai Stablecoin", symbol:"DAI", totalSupply:TOTAL_SUPPLY },
      { decimals:18,  name:"Dai yVault", symbol:"yvDAI" }
    ],
    [
      { decimals:6, name:"USD Coin", symbol:"USDC", totalSupply:TOTAL_SUPPLY },
      { decimals:6, name:"USDC yVault", symbol:"yvUSDC" }
    ]
  ],
  "Rari": [
    [
      { decimals:18, name:"Dai Stablecoin", symbol:"DAI", totalSupply:TOTAL_SUPPLY },
      { decimals:18,  name:"Rari DAI Pool Token", symbol:"RDPT" }
    ],
    [
      { decimals:6, name:"USD Coin", symbol:"USDC", totalSupply:TOTAL_SUPPLY },
      { decimals:18, name:"Rari Stable Pool Token", symbol:"RSPT" }
    ]
  ]
};

const INTEGRATION_TOKENS: { [type:string]: TokenInfo[][]; } = {
  "Lido": [
    [
      { decimals:18, name:"ETH Mock", symbol:"ETH", totalSupply:TOTAL_SUPPLY },
      { decimals:18, name:"Liquid staked Ether 2.0", symbol:"stETH", deploymentName:"Lido" }
    ]
  ],
  "PoLido": [
    [
      { decimals:18, name:"MATIC Mock", symbol:"MATIC", totalSupply:TOTAL_SUPPLY },
      { decimals:18, name:"Liquid staked Matic", symbol:"stMATIC", deploymentName:"PoLido" }
    ]
  ] 
}

// If true, only integration tests should be run
export function isIntegrationTestsEnabled(): boolean {
  const env = process.env["INTEGRATION"];
  if (env) return true;
  return RUN_INTEGRATION_TESTS;
}

// Either specific PoolType string, or undefined
export function getOnlyRunPool(): string {
  const env = process.env["ONLY_TOKEN"];
  if (env) return env;
  return process.env["ONLY_POOL"] || ONLY_RUN_POOL;
}

// Either specific Yield Token string eg aUSDC, or undefined
export function getOnlyRunToken(): string {
  const env = process.env["ONLY_TOKEN"];
  if (env) return env;
  return ONLY_YIELD_TOKEN;
}

// Either Mock tokens or mainnet fork integration tokens
export function getTokens(integration:boolean): { [type:string]: TokenInfo[][]; } {
  return integration ? INTEGRATION_TOKENS : MOCK_TOKENS;
}
