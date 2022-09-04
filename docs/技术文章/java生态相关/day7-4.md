---
title: '分布式项目中maven依赖错误问题'
date: 2022-05-10 12:44:15
tags:
- 'maven'
- 'SpringBoot'
categories:
- 'java'
---

<!-- more -->

::: warning 最近在做分布式项目的时候，遇到一些以前写单spring项目没有遇到过的maven依赖问题

:::

##### 因为是有很多springboot服务的 所以我当然在父项目中加上了parent

```xml
 <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.12.RELEASE</version>
    </parent>

```

::: danger 当然啊这样子是没有什么问题的，问题出现在你父项目管理子项目依赖的时候。  

:::

##### 当你加上了dependencyManagement准备管理子项目的依赖时，注意！如果此时你 dependencyManagement内的依赖parent中也存在的话，子项目是加载不了任何依赖或者依赖加载不完全的。

比如下面这些依赖其实在spring-boot-start-parent中是已经指定了版本的，可是只要你在dependencyManagement内又声明了一次的话无论指定版本与否都是会报错的。其实根本不需要指定，子项目会自动去spring-boot-starter-parent中寻找依赖版本的。

```xml
                 &ndash;&gt;-->
            <!--             <dependency>-->
            <!--                <groupId>mysql</groupId>-->
            <!--                <artifactId>mysql-connector-java</artifactId>-->
            <!--             </dependency>-->

            <!--            <dependency>-->
            <!--                <groupId>org.projectlombok</groupId>-->
            <!--                <artifactId>lombok</artifactId>-->
            <!--            </dependency>-->

            <!--            <dependency>-->
            <!--                <groupId>org.springframework.boot</groupId>-->
            <!--                <artifactId>spring-boot-starter-data-redis</artifactId>-->
            <!--            </dependency>-->

```

