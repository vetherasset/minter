const assert = require("assert")
const hre = require("hardhat")
const { ethers, upgrades } = hre
const { USDV } = require("./constants")

async function main() {
    try {
        console.log(`network: ${hre.network.name}`)
        const usdv = USDV[hre.network.name]
        assert(usdv, "usdv not defined")

        console.log(`usdv: ${usdv}`)

        const Minter = await ethers.getContractFactory("VaderMinterUpgradeable")
        console.log("Deploying Minter...")
        const minter = await upgrades.deployProxy(Minter, {
            initializer: "initialize",
            constructorArgs: [usdv],
        })
        await minter.deployed()
        console.log("Minter deployed to:", minter.address)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

main()
