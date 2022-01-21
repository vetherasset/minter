const assert = require("assert")
const hre = require("hardhat")
const { ethers, upgrades } = hre
const { USDV, PROXY } = require("../constants")

async function main() {
    try {
        console.log(`network: ${hre.network.name}`)

        const usdv = USDV[hre.network.name]
        assert(usdv, "usdv not defined")
        const proxy = PROXY[hre.network.name]
        assert(proxy, "proxy not defined")

        console.log(`usdv: ${usdv}`)
        console.log(`proxy: ${proxy}`)

        const TestMinterV2 = await ethers.getContractFactory("TestMinterV2")
        console.log("Upgrading proxy...")
        const testMinterV2 = await upgrades.upgradeProxy(proxy, TestMinterV2, {
            constructorArgs: [usdv],
        })
        await testMinterV2.deployed()

        console.log("proxy upgraded")
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

main()
