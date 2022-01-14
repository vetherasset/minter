// SPDX-License-Identifier: MIT AND AGPL-3.0-or-later

pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/ILiquidityBasedTWAP.sol";
import "./interfaces/IVaderMinterUpgradeable.sol";
import "./interfaces/IUSDV.sol";

contract VaderMinterUpgradeable is IVaderMinterUpgradeable, OwnableUpgradeable {
    uint256 private constant _MAX_BASIS_POINTS = 10_000;

    // USDV Contract for Mint / Burn Operations
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    IUSDV public immutable usdv;

    // The LBT pricing mechanism for the conversion
    ILiquidityBasedTWAP public lbt;

    // The 24 hour limits on USDV mints that are available for public minting and burning as well as the fee.
    Limits public dailyLimits;

    // The current cycle end timestamp
    uint256 public cycleTimestamp;

    // The current cycle cumulative mints
    uint256 public cycleMints;

    // The current cycle cumulative burns
    uint256 public cycleBurns;

    // The limits applied to each partner
    mapping(address => Limits) public partnerLimits;

    // Transmuter Contract
    address public transmuter;

    /* ========== CONSTRUCTOR ========== */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _usdv) {
        require(_usdv != address(0), "usdv = zero address");
        usdv = IUSDV(_usdv);
    }

    function initialize() external initializer {
        __Ownable_init();
        cycleTimestamp = block.timestamp;
    }

    /* ========== VIEWS ========== */

    function getPublicFee() public view returns (uint256) {
        // 24 hours passed, reset fee to 100%
        if (block.timestamp >= cycleTimestamp) {
            return dailyLimits.fee;
        }

        // cycle timestamp > block.timestamp, fee < 100%
        return
            (dailyLimits.fee * (cycleTimestamp - block.timestamp)) / 24 hours;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /*
     * @dev Public mint function that receives Vader and mints USDV.
     * @param vAmount Vader amount to burn.
     * @param uAmountMinOut USDV minimum amount to get back from the mint.
     * @returns uAmount in USDV, represents the USDV amount received from the mint.
     **/
    function mint(uint256 vAmount, uint256 uAmountMinOut)
        external
        returns (uint256 uAmount)
    {
        uint256 vPrice = lbt.getVaderPrice();

        uAmount = (vPrice * vAmount) / 1e18;

        require(
            uAmount >= uAmountMinOut,
            "VMU::mint: Insufficient Trade Output"
        );

        if (cycleTimestamp <= block.timestamp) {
            cycleTimestamp = block.timestamp + 24 hours;
            cycleMints = uAmount;
        } else {
            cycleMints += uAmount;
        }

        require(
            cycleMints <= dailyLimits.mintLimit,
            "VMU::mint: 24 Hour Limit Reached"
        );

        usdv.mint(
            msg.sender,
            vAmount,
            uAmount,
            getPublicFee(),
            lbt.maxUpdateWindow()
        );
        return uAmount;
    }

    /*
     * @dev Public burn function that receives USDV and mints Vader.
     * @param uAmount USDV amount to burn.
     * @param vAmountMinOut Vader minimum amount to get back from the burn.
     * @returns vAmount in Vader, represents the Vader amount received from the burn.
     *
     **/
    function burn(uint256 uAmount, uint256 vAmountMinOut)
        external
        returns (uint256 vAmount)
    {
        uint256 vPrice = lbt.getVaderPrice();

        vAmount = (1e18 * uAmount) / vPrice;

        require(
            vAmount >= vAmountMinOut,
            "VMU::burn: Insufficient Trade Output"
        );

        if (cycleTimestamp <= block.timestamp) {
            cycleTimestamp = block.timestamp + 24 hours;
            cycleBurns = uAmount;
        } else {
            cycleBurns += uAmount;
        }

        require(
            cycleBurns <= dailyLimits.burnLimit,
            "VMU::mint: 24 Hour Limit Reached"
        );

        usdv.burn(
            msg.sender,
            uAmount,
            vAmount,
            getPublicFee(),
            lbt.maxUpdateWindow()
        );
        return vAmount;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /*
     * @dev Partner mint function that receives Vader and mints USDV.
     * @param vAmount Vader amount to burn.
     * @returns uAmount in USDV, represents the USDV amount received from the mint.
     *
     * Requirements:
     * - Can only be called by whitelisted partners.
     **/
    function partnerMint(uint256 vAmount) external returns (uint256 uAmount) {
        require(
            partnerLimits[msg.sender].mintLimit != 0,
            "VMU::partnerMint: Not Whitelisted"
        );
        uint256 vPrice = lbt.getVaderPrice();

        uAmount = (vPrice * vAmount) / 1e18;

        Limits storage _partnerLimits = partnerLimits[msg.sender];

        require(
            uAmount <= _partnerLimits.mintLimit,
            "VMU::partnerMint: Mint Limit Reached"
        );

        unchecked {
            _partnerLimits.mintLimit -= uAmount;
        }

        usdv.mint(
            msg.sender,
            vAmount,
            uAmount,
            _partnerLimits.fee,
            lbt.maxUpdateWindow()
        );
        return uAmount;
    }

    /*
     * @dev Partner burn function that receives USDV and mints Vader.
     * @param uAmount USDV amount to burn.
     * @returns vAmount in Vader, represents the Vader amount received from the mint.
     *
     * Requirements:
     * - Can only be called by whitelisted partners.
     **/
    function partnerBurn(uint256 uAmount) external returns (uint256 vAmount) {
        require(
            partnerLimits[msg.sender].burnLimit != 0,
            "VMU::partnerBurn: Not Whitelisted"
        );
        uint256 vPrice = lbt.getVaderPrice();

        vAmount = (1e18 * uAmount) / vPrice;

        Limits storage _partnerLimits = partnerLimits[msg.sender];

        require(
            vAmount <= _partnerLimits.burnLimit,
            "VMU::partnerBurn: Burn Limit Reached"
        );

        unchecked {
            _partnerLimits.burnLimit -= vAmount;
        }

        usdv.burn(
            msg.sender,
            uAmount,
            vAmount,
            _partnerLimits.fee,
            lbt.maxUpdateWindow()
        );
        return vAmount;
    }

    /*
     * @dev Sets the daily limits for public mints represented by the param {_dailyMintLimit}.
     *
     * Requirements:
     * - Only existing owner can call this function.
     * - Param {_fee} fee can not be bigger than _MAX_BASIS_POINTS.
     * - Param {_mintLimit} mint limit can be 0.
     * - Param {_burnLimit} burn limit can be 0.
     **/
    function setDailyLimits(
        uint256 _fee,
        uint256 _mintLimit,
        uint256 _burnLimit
    ) external onlyOwner {
        require(_fee <= _MAX_BASIS_POINTS, "VMU::setDailyLimits: Invalid Fee");

        Limits memory _dailyLimits = Limits({
            fee: _fee,
            mintLimit: _mintLimit,
            burnLimit: _burnLimit
        });

        emit DailyLimitsChanged(dailyLimits, _dailyLimits);
        dailyLimits = _dailyLimits;
    }

    /*
     * @dev Sets the a partner address {_partner }  to a given limit {_limits} that represents the ability
     * to mint USDV from the reserve partners minting allocation.
     *
     * Requirements:
     * - Only existing owner can call this function.
     * - Param {_partner} cannot be a zero address.
     * - Param {_fee} fee can not be bigger than _MAX_BASIS_POINTS.
     * - Param {_mintLimit} mint limits can be 0.
     * - Param {_burnLimit} burn limits can be 0.
     **/
    function whitelistPartner(
        address _partner,
        uint256 _fee,
        uint256 _mintLimit,
        uint256 _burnLimit
    ) external onlyOwner {
        require(_partner != address(0), "VMU::whitelistPartner: Zero Address");
        require(
            _fee <= _MAX_BASIS_POINTS,
            "VMU::whitelistPartner: Invalid Fee"
        );
        emit WhitelistPartner(_partner, _mintLimit, _burnLimit, _fee);
        partnerLimits[_partner] = Limits({
            fee: _fee,
            mintLimit: _mintLimit,
            burnLimit: _burnLimit
        });
    }

    /*
     * @dev Sets the transmuter contract address represented by the param {_transmuter}.
     *
     * Requirements:
     * - Only existing owner can call this function.
     * - Param {_transmuter} can not be address ZERO.
     **/
    function setTransmuterAddress(address _transmuter) external onlyOwner {
        require(
            _transmuter != address(0),
            "VMU::setTransmuterAddress: Zero Address"
        );
        transmuter = _transmuter;
    }

    /*
     * @dev Sets the lbt contract address represented by the param {_lbt}.
     *
     * Requirements:
     * - Only existing owner can call this function.
     * - Param {_lbt} can not be address ZERO.
     **/
    function setLBT(ILiquidityBasedTWAP _lbt) external onlyOwner {
        require(
            _lbt != ILiquidityBasedTWAP(address(0)),
            "VMU::setLBT: Insufficient Privileges"
        );
        lbt = _lbt;
    }
}
