---
title: 'java.io.UnsupportedEncodingException: UTF‐8问题'
date: 2021-11-10 1:44:15
tags:
- 'java字符集问题'
categories:
- 'java'


---

::: tip 在对接其他系统的接口或者在传输数据（比如写出html）的时候“java.io.UnsupportedEncodingException: UTF‐8”这样的异常是很常见的

:::

-

::: danger

问题就在于很多时候都是直接 String xx  = "UTF-8"这样的形式去指定编码的，但是呢这样的方式其实是要求你自己处理异常。 

::: 

##### 其实在java7中就有标准的字符集定义库：StandardCharsets，可以直接String装箱使用，避免java.io.UnsupportedEncodingException: UTF‐8异常的出现。

如下图这样子就不会出现异常了

```java
String CHARSET = new String(String.valueOf(StandardCharsets.UTF_8));
```

