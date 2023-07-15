import * as dotenv from 'dotenv'

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-storage-layout'
import 'hardhat-contract-sizer'
import 'hardhat-storage-layout-changes'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import 'hardhat-abi-exporter'

dotenv.config()

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.19',
        settings: {
            viaIR: false,
            optimizer: {
                enabled: true,
                runs: 1000,
                details: {
                    yul: false,
                },
            },
        },
    },
    networks: {
        hardhat: {
            mining: {
                auto: false,
            },
            chainId: 1,
            forking: {
                enabled: true,
                url: process.env.MAINNET_URL as string,
                blockNumber: 17699900,
            },
            accounts: {
                count: 10,
            },
        },
    },
    gasReporter: {
        enabled: true,
        currency: 'USD',
        gasPrice: 60,
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY!,
        },
    },
    paths: {
        storageLayouts: '.storage-layouts',
    },
    abiExporter: {
        path: './exported-abi',
        runOnCompile: true,
        clear: true,
        flat: true,
        only: ['RandaoAccessor'],
        spacing: 2,
    },
}

export default config
