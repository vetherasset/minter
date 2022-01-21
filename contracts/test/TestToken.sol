// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    // decimals = 18
    constructor() ERC20("USDV", "USDV") {}
}
