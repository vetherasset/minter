const { ethers, upgrades, network } = require("hardhat")
const { PROXY, USDV } = require("../constants")
const assert = require("assert")

async function main() {
    console.log(`Network: ${network.name}`)

    const proxy = PROXY[network.name]
    const usdv = USDV[network.name]

    assert(proxy, "no Proxy")
    assert(usdv, "no USDV")

    console.log(`PROXY: ${proxy}`)
    console.log(`USDV: ${usdv}`)

    const VaderMinterV3 = await ethers.getContractFactory(
        "contracts/v3/VaderMinterUpgradeable.sol:VaderMinterUpgradeable"
    )

    await upgrades.upgradeProxy(proxy, VaderMinterV3, {
        constructorArgs: [usdv],
    })

    console.log(`Upgrade done: ${proxy}`)
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
