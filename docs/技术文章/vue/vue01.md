---
title: '不怎么懂的前端知识-1'
date: 2021-11-01 12:44:15
tags:
- 'vue'
- 'js'
categories:
- '前端'
---

::: danger  一些零零碎碎的前端知识


:::

<!-- more -->

##### 有些情况下用户退出登录了，会报404，是因为路由跳转没设置好。所以需要个路由守卫来保底。（还需要在vuex-Store中清理下浏览器缓存）

```js
router/index.js
//路由守卫
router.beforeEach((to, from, next) => {
//未匹配路由情况
    if (!to.matched.length) {
        //判断浏览器有无缓存从而设置是否跳转
        const storeMenus = localStorage.getItem("menus")
        if (storeMenus) {
            next("/404")
        } else {
            next("/login")
        }
    }
    next()

})

======================
 logout() {
            localStorage.removeItem("user")
            localStorage.removeItem("menus")
            router.push("/login")

            //重置路由 解决logout后路由未清理导致的错误
            resetRouter()

        }
```

##### 子组件如果需要调用父组件的方法 可以这样写

```vue
<el-main>
          <!--          子组件触发父组件方法-->
          <router-view @refreshUser="getUser" :userdata="user"/>
        </el-main>
```

##### 通常引入UI需要在main.js下配置

```js
new Vue({
    router,
    store,
这个->render: h => h(App)
}).$mount('#app')
```

