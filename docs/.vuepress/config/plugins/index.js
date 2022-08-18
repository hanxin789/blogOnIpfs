//插件目录
module.exports = {
  'flowchart': {

  },
  '@vuepress/pwa': {
    serviceWorker: true,
    updatePopup: {
      message: "有新的内容更新",
      buttonText: "刷新"
    }
  },
  "vuepress-plugin-auto-sidebar": {
    // collapsable: true,
    // titleMode: "titlecase",
  },
  "vuepress-plugin-baidu-autopush": {

  },
  'sitemap': {
    hostname: 'https://www.xxx.com'
  },
  'copyright': {
    noCopy: true, // 选中的文字将无法被复制
    minLength: 50, // 如果长度超过 100 个字符
  },
  '@vuepress/medium-zoom': {
    selector: 'img',
    // medium-zoom options here
    // See: https://github.com/francoischalifour/medium-zoom#options
    options: {
      margin: 16
    }
  },
  "dynamic-title": {
    showIcon: "/favicon.ico",
    showText: "(/≧▽≦/)欢迎回来！",
    hideIcon: "/favicon.ico",
    hideText: "(●—●)哦吼,不要走,给个收藏吧！",
    recoverTime: 2000
  },
  '@vuepress/nprogress': {

  },
  'vuepress-plugin-smooth-scroll': {

  },
  // '@vuepress-reco/vuepress-plugin-rss': {
  //   site_url: "https://it235.com", //网站地址
  //   copyright: ""
  // },
  'reading-progress': {
    //阅读进度条
  },
  'vuepress-plugin-code-copy': {
    //一键复制代码
  },
  '@vuepress-reco/vuepress-plugin-bgm-player': {
    autoShrink: {
      type: true
    },
    audios: [

      {
        name: "我的青春热爱",
        artist: "歌之初乐队",
        url:
          "https://music.163.com/song/media/outer/url?id=1500136911",
        cover:
          "http://p2.music.126.net/hYWCrW4oYuHLjswOooXD7A==/109951165515272741.jpg?param=130y130",
      },
      {
        name: "前进，国际纵队！",
        artist: "全体无产者",
        url:
          "https://music.163.com/song/media/outer/url?id=1472007346",
        cover:
          "http://p1.music.126.net/Y_8CaTjbSNp6oPElEo9lNg==/109951165288587320.jpg?param=130y130",
      },


      {
        name: "活着",
        artist: "郝云",
        url: "https://music.163.com/song/media/outer/url?id=27646786",
        cover:
          "http://p1.music.126.net/9A9o8KnCftKoJLmfk7jE-A==/1252343744099790.jpg?param=130y130",
      },

      {
        name: "丑八怪",
        artist: "薛之谦",
        url:
          "https://music.163.com/song/media/outer/url?id=27808044.mp3",
        cover:
          "https://p2.music.126.net/VjN74c1hoYgPCEZ9DngeQw==/109951163772624643.jpg",
      },
    ],
  },
  "social-share": //分享插件
  {
    title: '234',
    description: '123',
    sites: ['qzone', 'qq', 'weibo', 'wechat', 'douban'], // 启用的站点
    networks: ['qzone', "qq", "weibo", "wechat", "douban", "email"], //分享类型
    email: "nobug@mail.com", //email地址
    wechatQrcodeTitle: '微信扫一扫：分享', // 微信二维码提示文字
  },
}