
module.exports = [
    {
        text: '本站指南', link: '/guide/', icon: 'reco-eye'
    },
    {
        text: '一些想法', link: '/音乐社科与杂谈/', icon: 'reco-faq',
        items: [
            { text: '音乐社科与杂谈', link: '/音乐社科与杂谈/day8-18' },
        ]
    },
    {
        text: '踩坑经历', link: '/技术文章/', icon: 'reco-api',
        items: [
            {
                text: 'Java',
                items: [
                    { text: 'JavaSE', link: '/技术文章/javase/day1-6' },
                    { text: 'Java生态', link: '/技术文章/java生态相关/day7-4' },
                ]
            },
            {

                text: '网络与服务器', link: '/技术文章/网络与服务器/day8-18'


            },
            {
                text: '前端',
                items: [
                    { text: '前端基础', link: '/技术文章/vue/vue01' },
                ]
            },
        ]
    },
    {
        text: '其他站点', icon: 'reco-blog',
        items: [
            { text: 'B站', link: 'https://space.bilibili.com/19293296?spm_id_from=333.788.0.0', icon: 'reco-bilibili' },
            { text: 'gitee', link: 'https://gitee.com/hanxin_12', icon: 'reco-mayun' },
        ]
    },/**/
    { text: '时间轴', link: '/timeline/', icon: 'reco-date' }
]