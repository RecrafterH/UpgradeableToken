// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TokenV3 is ERC20Upgradeable, ERC20BurnableUpgradeable {
    address public boss;
    address public dev;
    uint public fee;

    function initialize(uint _fee, address _dev) public initializer {
        __ERC20_init("TokenV2", "TOV");
        boss = msg.sender;
        fee = _fee;
        dev = _dev;
        _mint(boss, 2000000 * 10 ** 18);
    }

    function transfer(
        address to,
        uint256 _amount
    ) public override returns (bool) {
        address owner = _msgSender();
        uint bonus = (_amount * fee) / 100;
        uint development = bonus / 2;
        uint burner = bonus / 2;

        uint amount = _amount - bonus;
        _transfer(owner, to, amount);
        _transfer(owner, dev, development);
        burn(burner);
        return true;
    }

    modifier onlyBoss() {
        require(msg.sender == boss, "You are not the boss");
        _;
    }

    function changeFee(uint _fee) public onlyBoss {
        require(_fee <= 100, "Its too much");
        fee = _fee;
    }

    function getFee() public view returns (uint) {
        return fee;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        address spender = _msgSender();
        uint bonus = (amount * fee) / 100;

        uint development = bonus / 2;
        uint burner = bonus / 2;
        uint _amount = amount - development;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, _amount);
        _transfer(from, dev, development);
        burn(burner);

        return true;
    }

    function changeBoss(address newBoss) external onlyBoss {
        boss = newBoss;
    }

    function getBoss() public view returns (address) {
        return boss;
    }

    uint256[45] private __gap;
}
