// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";

contract TokenV1 is ERC20Upgradeable, ERC20BurnableUpgradeable {
    address public boss;
    address public dev;
    uint public fee;

    function initialize(uint _fee, address _dev) public initializer {
        __ERC20_init("TokenV1", "TOV");
        boss = msg.sender;
        fee = _fee;
        dev = _dev;
        _mint(boss, 1000000 * 10 ** 18);
    }

    function transfer(
        address to,
        uint256 _amount
    ) public override returns (bool) {
        address owner = _msgSender();
        uint bonus = (_amount * fee) / 100;

        uint amount = _amount - bonus;
        _transfer(owner, to, amount);
        _transfer(owner, dev, bonus);
        return true;
    }

    uint256[45] private __gap;
}
