---
title: '模板设计模式'
date: 2021-05-01 12:44:15
tags:
- '设计模式'
categories:
- 'java'
---

::: tip 模板设计模式

比如抽象类体现的就是一种模板模式的设计,抽象类作为多个之类的通用模板，子类在抽象类的基础上进行扩展改造，但子类肯定是会保留抽象类的特点的。

:::

<!-- more -->

#### 所以当一个功能一部分是确定的一部分是不确定的,此时就可以使用模板设计模式

```java
package com.abstract_;
abstract public class Template { //抽象类-模板设计模式
public abstract void job();//抽象方法
public void calculateTime() {//实现方法，调用 job 方法
//得到开始的时间
long start = System.currentTimeMillis();
job(); //动态绑定机制
//得的结束的时间
long end = System.currentTimeMillis();
System.out.println("任务执行时间 " + (end - start));
}
}
package com.abstract_;
public class AA extends Template {
//计算任务
//1+....+ 800000
@Override
public void job() { //实现 Template 的抽象方法 job
long num = 0;
for (long i = 1; i <= 800000; i++) {
num += i;
}
}
// public void job2() {
// //得到开始的时间
// long start = System.currentTimeMillis();
// long num = 0;
// for (long i = 1; i <= 200000; i++) {
// num += i;
// }
// //得的结束的时间
// long end = System.currentTimeMillis();
// System.out.println("AA 执行时间 " + (end - start));
// }
}
package com.abstract_;
public class BB extends Template{
public void job() {//这里重写了 Template 的 job 方法
long num = 0;
for (long i = 1; i <= 80000; i++) {
num *= i;
}
}
}
package com.abstract_;
public class TestTemplate {
public static void main(String[]
```

