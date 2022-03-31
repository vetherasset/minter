require("@nomiclabs/hardhat-ethers")
require("@openzeppelin/hardhat-upgrades")
require("@nomiclabs/hardhat-etherscan")

const { alchemyApiKey, mnemonic, etherscanApiKey } = require("./secrets.json")

module.exports = {
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        kovan: {
            url: `https://eth-kovan.alchemyapi.io/v2/${alchemyApiKey}`,
            accounts: { mnemonic },
        },
        mainnet: {
            url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyApiKey}`,
            accounts: { mnemonic },
        },
        hardhat: {
            forking: {
                url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyApiKey}`,
            },
        },
    },
    etherscan: {
        apiKey: etherscanApiKey,
    },
}
