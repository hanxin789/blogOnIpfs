---
title: '单例设计模式'
date: 2021-05-10 12:44:15
tags:
- '设计模式'
categories:
- 'java'

---

::: tip 单例设计模式

单例设计模式即采取方法在项目（软件系统中）保证某个类只能存在一个对象实例

:::

<!-- more -->

::: warning

单例设计模式又分为饿汉式和懒汉式 

两者最主要的区别就是创建对象的时机不一致,饿汉式是类加载的时候就会创建对象（static方法），而懒汉式是使用是才会创建对象。懒汉式会存在因为多了判断所以会存在线程安全问题

:::

#### 

```java
//步骤[单例模式-饿汉式]
//1. 将构造器私有化
//2. 在类的内部直接创建对象(该对象是 static)
//3. 提供一个公共的 static 方法，返回 gf 对象
package com.single_;
public class SingleTon01 {

public static void main(String[] args) {
// GirlFriend xh = new GirlFriend("小红");
// GirlFriend xb = new GirlFriend("小白");
//通过方法可以获取对象
GirlFriend instance = GirlFriend.getInstance();
System.out.println(instance);
GirlFriend instance2 = GirlFriend.getInstance();
System.out.println(instance2);
System.out.println(instance == instance2);
//System.out.println(GirlFriend.n1);

}
//有一个类， GirlFriend
//只能有一个女朋友
class GirlFriend {
private String name;
//public static int n1 = 100;
//为了能够在静态方法中，返回 gf 对象，需要将其修饰为 static
//對象，通常是重量級的對象, 餓漢式可能造成創建了對象，但是沒有使用. private static GirlFriend gf = new GirlFriend("小红红");
private GirlFriend(String name) {
System.out.println("构造器被调用");
this.name = name;
}
public static GirlFriend getInstance() {
return gf;
}
@Override
public String toString() {
return "GirlFriend{" +
"name='" + name + '\'' +
'}';
}

}

```

```java
//步驟
//1.仍然构造器私有化
//2.定義一個 static 靜態屬性對象
//3.提供一個 public 的 static 方法，可以返回一個 Cat 對象
//4.懶漢式，只有當用戶使用 getInstance 時，才返回 cat 對象, 後面再次調用時，會返回上次創建的 cat 對象
// 從而保證了單例
public class SingleTon02 {
public static void main(String[] args) {
//new Cat("大黃");
//System.out.println(Cat.n1);
Cat instance = Cat.getInstance();
System.out.println(instance);
//再次調用 getInstance
Cat instance2 = Cat.getInstance();
System.out.println(instance2);
System.out.println(instance == instance2);//T
}
}
//希望在程序運行過程中，只能創建一個 Cat 對象

//使用單例模式
class Cat {
private String name;
public static int n1 = 999;
private static Cat cat ; //默認是 null

private Cat(String name) {
System.out.println("構造器調用...");
this.name = name;
}
public static Cat getInstance() {
if(cat == null) {//如果還沒有創建 cat 對象
cat = new Cat("小可愛");
}
return cat;
}
@Override
public String toString() {
return "Cat{" +
"name='" + name + '\'' +
'}';
}
}
```

