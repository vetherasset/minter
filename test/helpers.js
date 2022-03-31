const { network, ethers } = require("hardhat")

const impersonate = async (address) => {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
    })

    // give the address ETH for gas
    await network.provider.send("hardhat_setBalance", [
        address,
        ethers.utils.hexValue(ethers.utils.parseEther("1000")),
    ])

    return await ethers.getSigner(address)
}

module.exports = {
    impersonate,
}
