require("@nomiclabs/hardhat-ethers")
require("@openzeppelin/hardhat-upgrades")
require("@nomiclabs/hardhat-etherscan")

const { alchemyApiKey, mnemonic, etherscanApiKey } = require("./secrets.json")

module.exports = {
    solidity: "0.8.9",
    networks: {
        kovan: {
            url: `https://eth-kovan.alchemyapi.io/v2/${alchemyApiKey}`,
            accounts: { mnemonic: mnemonic },
        },
        mainnet: {
            url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyApiKey}`,
            accounts: { mnemonic: mnemonic },
        },
    },
    etherscan: {
        apiKey: etherscanApiKey,
    },
}
