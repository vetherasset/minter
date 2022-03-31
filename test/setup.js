const chai = require("chai")
chai.use(require("ethereum-waffle").solidity)
const { expect } = chai

module.exports = {
    expect,
}
