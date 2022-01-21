const { expect } = require("../setup")

let accounts
let usdv
let minter
let minterV2

describe("TestMinterV2", () => {
    before(async () => {
        accounts = await ethers.getSigners()

        const TestToken = await ethers.getContractFactory("TestToken")
        usdv = await TestToken.deploy()
        await usdv.deployed()

        const Minter = await ethers.getContractFactory("VaderMinterUpgradeable")
        minter = await upgrades.deployProxy(Minter, {
            initializer: "initialize",
            constructorArgs: [usdv.address],
        })
    })

    it("should upgrade", async () => {
        // initialize V1
        const fee = 100
        const mintLimit = 1000
        const burnLimit = 2000
        const lockDuration = 30

        await minter.setDailyLimits(fee, mintLimit, burnLimit, lockDuration)

        // upgrade
        const TestMinterV2 = await ethers.getContractFactory("TestMinterV2")
        minterV2 = await upgrades.upgradeProxy(minter.address, TestMinterV2, {
            constructorArgs: [usdv.address],
        })

        // test V2 storage
        await minterV2.test()

        expect((await minterV2.version()).toString()).to.equal("2")

        const limits = await minterV2.dailyLimits()
        expect(limits.fee.toString()).to.equal(fee.toString())
        expect(limits.mintLimit.toString()).to.equal(mintLimit.toString())
        expect(limits.burnLimit.toString()).to.equal(burnLimit.toString())
        expect(limits.lockDuration.toString()).to.equal(lockDuration.toString())
    })
})
