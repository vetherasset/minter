const { ethers, network, upgrades } = require("hardhat")
const { expect } = require("../setup")
const { alchemyApiKey } = require("../../secrets.json")
const { USDV, PROXY, VADER } = require("../../scripts/constants")
const { impersonate } = require("../helpers")

describe("V3", () => {
    let usdv
    let vader
    let minter
    let owner
    let partner
    let user

    let usdvWhale
    let vaderWhale

    beforeEach(async () => {
        // fork to block number when VaderMinter contract was at v2
        await network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${alchemyApiKey}`,
                        blockNumber: 14475210,
                    },
                },
            ],
        })

        // setup tokens
        usdv = await ethers.getContractAt("IUSDV", USDV.mainnet)
        vader = await ethers.getContractAt("ERC20", VADER.mainnet)

        // import v2
        const VaderMinterV2 = await ethers.getContractFactory(
            "VaderMinterUpgradeable"
        )
        minter = await upgrades.forceImport(PROXY.mainnet, VaderMinterV2, {
            constructorArgs: [usdv.address],
        })

        // impersonate owner of VaderMinter (who is also owner of ProxyAdmin)
        ownerAddress = await minter.owner()
        owner = await impersonate(ownerAddress)
        // leave first few blank in case they're in use
        ;[, , , partner, user] = await ethers.getSigners()

        // upgrade to v3
        const VaderMinterV3 = await ethers.getContractFactory(
            "VaderMinterUpgradeableV3"
        )

        // // short way (needs the ProxyAdmin owner to be account[0])
        // minter = await upgrades.upgradeProxy(PROXY.mainnet, VaderMinterV3, {
        //     constructorArgs: [usdv.address],
        // })

        // long way
        const adminAddress = (await upgrades.admin.getInstance()).address
        const admin = await ethers.getContractAt("ProxyAdmin", adminAddress)

        const newImplementationAddress = await upgrades.prepareUpgrade(
            minter.address,
            VaderMinterV3,
            {
                constructorArgs: [usdv.address],
            }
        )

        const tx = await admin
            .connect(owner)
            .upgrade(minter.address, newImplementationAddress)
        await tx.wait()

        minter = await ethers.getContractAt(
            "VaderMinterUpgradeableV3",
            PROXY.mainnet
        )

        // impersonate whales with usdv and vader
        usdvWhale = await impersonate(
            "0x8F7037074c7cD129588b5A8d731D116DC645eB6A"
        )
        vaderWhale = await impersonate(
            "0x39D2e0A53BFe8d58d6228dcc31b951276015ff54"
        )
    })

    it("partner burn limit now in USDV instead of VADER", async () => {
        const limit = ethers.utils.parseEther("1000")

        let tx = await minter
            .connect(owner)
            .whitelistPartner(partner.address, 0, limit, limit, 0)
        await tx.wait()

        // fund partner with usdv
        tx = await usdv.connect(usdvWhale).transfer(partner.address, limit)
        await tx.wait()

        expect((await minter.partnerLimits(partner.address)).burnLimit).to.eq(
            ethers.utils.parseEther("1000")
        )

        await minter.connect(partner).partnerBurn(limit, 0)
        expect((await minter.partnerLimits(partner.address)).burnLimit).to.eq(0)
    })

    it("unsafeDestroyUsdv() destroys USDV", async () => {
        // fund user with usdv
        let tx = await usdv
            .connect(usdvWhale)
            .transfer(user.address, ethers.utils.parseEther("1000"))
        await tx.wait()

        const [
            userUsdvBefore,
            userVaderBefore,
            totalUsdvBefore,
            totalVaderBefore,
        ] = await Promise.all([
            usdv.balanceOf(user.address),
            vader.balanceOf(user.address),
            usdv.totalSupply(),
            vader.totalSupply(),
        ])

        expect(userUsdvBefore).to.eq(ethers.utils.parseEther("1000"))
        expect(userVaderBefore).to.eq(0)

        tx = await minter
            .connect(user)
            .unsafeDestroyUsdv(ethers.utils.parseEther("1000"))
        await tx.wait()

        const [userUsdvAfter, userVaderAfter, totalUsdvAfter, totalVaderAfter] =
            await Promise.all([
                usdv.balanceOf(user.address),
                vader.balanceOf(user.address),
                usdv.totalSupply(),
                vader.totalSupply(),
            ])

        // usdv was burnt and no vader was minted for user
        expect(userUsdvAfter).to.eq(0)
        expect(userVaderAfter).to.eq(0)
        expect(totalUsdvAfter).to.eq(
            totalUsdvBefore.sub(ethers.utils.parseEther("1000"))
        )
        expect(totalVaderAfter).to.eq(totalVaderBefore.add(1)) // 1 wei was minted for owner since uAmount cannot be 0
    })

    it("unsafeDestroyVader() destroys Vader", async () => {
        // fund user with usdv
        let tx = await vader
            .connect(vaderWhale)
            .transfer(user.address, ethers.utils.parseEther("1000"))
        await tx.wait()

        // user approve usdv spend vader
        tx = await vader
            .connect(user)
            .approve(usdv.address, ethers.constants.MaxUint256)
        await tx.wait()

        // can't burn less than 1 gwei of USDV worth in VADER
        await expect(
            minter.connect(user).unsafeDestroyVader(1)
        ).to.be.revertedWith("VMU::unsafeDestroyVader: Minimum Amount")

        const [
            userUsdvBefore,
            userVaderBefore,
            totalUsdvBefore,
            totalVaderBefore,
        ] = await Promise.all([
            usdv.balanceOf(user.address),
            vader.balanceOf(user.address),
            usdv.totalSupply(),
            vader.totalSupply(),
        ])

        expect(userUsdvBefore).to.eq(0)
        expect(userVaderBefore).to.eq(ethers.utils.parseEther("1000"))

        tx = await minter
            .connect(user)
            .unsafeDestroyVader(ethers.utils.parseEther("1000"))
        await tx.wait()

        const [userUsdvAfter, userVaderAfter, totalUsdvAfter, totalVaderAfter] =
            await Promise.all([
                usdv.balanceOf(user.address),
                vader.balanceOf(user.address),
                usdv.totalSupply(),
                vader.totalSupply(),
            ])

        // vader was burnt and no usdv was minted
        expect(userUsdvAfter).to.eq(0)
        expect(userVaderAfter).to.eq(0)
        expect(totalUsdvAfter).to.eq(totalUsdvBefore.add(1))
        expect(totalVaderAfter).to.eq(
            totalVaderBefore.sub(ethers.utils.parseEther("1000"))
        )
    })
})
