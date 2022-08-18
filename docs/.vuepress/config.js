//主配置文件
const themeConfig = require('./config/theme/index.js')
const navConf = require('./config/nav')
const sidebarConf = require('./config/sidebar')
const pluginsConf = require('./config/plugins/index')
module.exports = {
    //注意，此处需要填写你部署在nginx下的文件夹名称，如果是根目录，那么可以注释掉此行，注释掉后本地打开index.html无法访问
    //base: "/dist/",
    title: "冯胖子的博客",
    description: '记录下生活的坑',
    dest: './dist',
    port: '7788',
    head: [
        ['link', { rel: 'icon', href: '/img/favicon.ico' }],
        //搜索关键字
        ['meta', { name: 'keywords', content: '杂谈,vuepress,自建博客,冯胖子' }],
        ['meta', { name: 'description', content: '音乐、计算机技术、艺术鉴赏、社科杂谈、java' }],
        ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }],
        //爬虫抓取
        ["meta", { name: "robots", content: "all" }],
        ["meta", { name: "author", content: "冯胖子" }],
        ["link", { rel: "stylesheet", href: "/css/style.css" }],//显示nav小logo
        ["script", { charset: "utf-8", src: "/js/custom.js" }],//加载右侧菜单栏图片
        // 百度统计
        /*
        ['script', {}, `
            var _hmt = _hmt || [];
            (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?e312f85a409131e18146064e62b19798";
                var s = document.getElementsByTagName("script")[0];
                s.parentNode.insertBefore(hm, s);
            })();
        `],
        */
    ],
    theme: 'reco',
    themeConfig: {
        mode: 'dark', // 默认 auto，auto 跟随系统，dark 暗色模式，light 亮色模式
        modePicker: false,// 默认 true，false 不显示模式调节按钮，true 则显示
        type: 'blog',
        smoothScroll: true,
        // 博客设置
        /*
        blogConfig: {
            category: {
                location: 2, // 在导航栏菜单中所占的位置，默认2
                text: '分类' // 默认 “分类”
            },
            tag: {
                location: 3, // 在导航栏菜单中所占的位置，默认3
                text: '标签' // 默认 “标签”
            }
        },*/
        valineConfig: {
            // your appId
            appId: 'xqb9OBTX6AlcEvpnX6rwvoG4-gzGzoHsz',
            // your appKey
            appKey: 'zRogonE84ib6vX2i2P91I30H',
            recordIP:true,
            placeholder:'来都来了，冒个泡再走呗...',
            visitor:true,
        },
        authorAvatar: '/avatar.png',
        // 最后更新时间
        lastUpdated: '2021-04-07', // string | boolean
        //repo: 'it235',
        // 如果你的文档不在仓库的根部
        //docsDir: 'docs',
        // 可选，默认为 master
        //docsBranch: 'source',
        //editLinks: true,
        //editLinkText: '在 GitHub 上编辑此页！',
        // 作者
        author: '冯胖子',
        // 项目开始时间
        startYear: '2021',
        nav: navConf,
        sidebar: sidebarConf,
        sidebarDepth: 2,
        // 自动形成侧边导航
        sidebar: 'auto',
        // logo: '/head.png',
        // 搜索设置
        search: true,
        searchMaxSuggestions: 10,
        // ICP备案
        // record: '沪ICP备16598885号',
        // recordLink: 'https://beian.miit.gov.cn/',
        // 公网安备备案
        // cyberSecurityRecord: '沪公网安备 16598885号',
        // cyberSecurityLink: 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=xxx05177',
        //友链
        friendLink: [
            {
                /*
                title:'',
                desc: '',
                email:'',
                link:''
                */

            },
            {

            },
        ]

    },
    markdown: {
        lineNumbers: true
    },
    plugins: pluginsConf
}