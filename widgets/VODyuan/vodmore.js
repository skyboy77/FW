/**
 * 纯净版后台播放源引擎 (内置 56 个普通源)
 * 专注作为 TMDB/豆瓣 等榜单模块的播放资源提供者
 * 不产生多余的列表，只响应搜索和解析请求
 */

// ================= 1. 普通源数据配置 (56个) =================
const NORMAL_SOURCES = [
    {"id": "feifan", "name": "非凡资源", "baseUrl": "http://ffzy5.tv/api.php/provide/vod"},
    {"id": "wolong", "name": "卧龙资源", "baseUrl": "https://wolongzyw.com/api.php/provide/vod"},
    {"id": "zuida", "name": "最大资源", "baseUrl": "https://api.zuidapi.com/api.php/provide/vod"},
    {"id": "baiduyun", "name": "百度云资源", "baseUrl": "https://api.apibdzy.com/api.php/provide/vod"},
    {"id": "baofeng", "name": "暴风资源", "baseUrl": "https://bfzyapi.com/api.php/provide/vod"},
    {"id": "jisu", "name": "极速资源", "baseUrl": "https://jszyapi.com/api.php/provide/vod"},
    {"id": "tianya", "name": "天涯资源", "baseUrl": "https://tyyszy.com/api.php/provide/vod"},
    {"id": "wujin", "name": "无尽资源", "baseUrl": "https://api.wujinapi.com/api.php/provide/vod"},
    {"id": "modu", "name": "魔都资源", "baseUrl": "https://www.mdzyapi.com/api.php/provide/vod"},
    {"id": "sanliuling", "name": "360资源", "baseUrl": "https://360zy.com/api.php/provide/vod"},
    {"id": "dytt", "name": "电影天堂", "baseUrl": "http://caiji.dyttzyapi.com/api.php/provide/vod"},
    {"id": "ruyi", "name": "如意资源", "baseUrl": "https://cj.rycjapi.com/api.php/provide/vod"},
    {"id": "wangwang", "name": "旺旺资源", "baseUrl": "https://wwzy.tv/api.php/provide/vod"},
    {"id": "hongniu", "name": "红牛资源", "baseUrl": "https://www.hongniuzy2.com/api.php/provide/vod"},
    {"id": "guangsu", "name": "光速资源", "baseUrl": "https://api.guangsuapi.com/api.php/provide/vod"},
    {"id": "ikun", "name": "iKun资源", "baseUrl": "https://ikunzyapi.com/api.php/provide/vod"},
    {"id": "youku", "name": "优酷资源", "baseUrl": "https://api.ukuapi.com/api.php/provide/vod"},
    {"id": "huya", "name": "虎牙资源", "baseUrl": "https://www.huyaapi.com/api.php/provide/vod"},
    {"id": "xinlang", "name": "新浪资源", "baseUrl": "http://api.xinlangapi.com/xinlangapi.php/provide/vod"},
    {"id": "lezi", "name": "乐子资源", "baseUrl": "https://cj.lziapi.com/api.php/provide/vod"},
    {"id": "haihua", "name": "海豚资源", "baseUrl": "https://hhzyapi.com/api.php/provide/vod"},
    {"id": "jiangyu", "name": "鲸鱼资源", "baseUrl": "https://jyzyapi.com/provide/vod"},
    {"id": "aidan", "name": "爱蛋资源", "baseUrl": "https://lovedan.net/api.php/provide/vod"},
    {"id": "moduzy", "name": "魔都影视", "baseUrl": "https://www.moduzy.com/api.php/provide/vod"},
    {"id": "feifanapi", "name": "非凡API", "baseUrl": "https://api.ffzyapi.com/api.php/provide/vod"},
    {"id": "feifancj", "name": "非凡采集", "baseUrl": "http://cj.ffzyapi.com/api.php/provide/vod"},
    {"id": "feifancj2", "name": "非凡采集HTTPS", "baseUrl": "https://cj.ffzyapi.com/api.php/provide/vod"},
    {"id": "feifan1", "name": "非凡线路1", "baseUrl": "http://ffzy1.tv/api.php/provide/vod"},
    {"id": "wolong2", "name": "卧龙采集", "baseUrl": "https://collect.wolongzyw.com/api.php/provide/vod"},
    {"id": "baofeng2", "name": "暴风APP", "baseUrl": "https://app.bfzyapi.com/api.php/provide/vod"},
    {"id": "wujin2", "name": "无尽ME", "baseUrl": "https://api.wujinapi.me/api.php/provide/vod"},
    {"id": "tianyazy", "name": "天涯海角", "baseUrl": "https://tyyszyapi.com/api.php/provide/vod"},
    {"id": "guangsu2", "name": "光速HTTP", "baseUrl": "http://api.guangsuapi.com/api.php/provide/vod"},
    {"id": "xinlang2", "name": "新浪HTTPS", "baseUrl": "https://api.xinlangapi.com/xinlangapi.php/provide/vod"},
    {"id": "yilingba2", "name": "1080JSON", "baseUrl": "https://api.1080zyku.com/inc/apijson.php"},
    {"id": "lezi2", "name": "乐子HTTP", "baseUrl": "http://cj.lziapi.com/api.php/provide/vod"},
    {"id": "uku88", "name": "U酷资源88", "baseUrl": "https://api.ukuapi88.com/api.php/provide/vod"},
    {"id": "wujincc", "name": "无尽CC", "baseUrl": "https://api.wujinapi.cc/api.php/provide/vod"},
    {"id": "yaya", "name": "丫丫点播", "baseUrl": "https://cj.yayazy.net/api.php/provide/vod"},
    {"id": "wolongcc", "name": "卧龙CC", "baseUrl": "https://collect.wolongzy.cc/api.php/provide/vod"},
    {"id": "wujinnet", "name": "无尽NET", "baseUrl": "https://api.wujinapi.net/api.php/provide/vod"},
    {"id": "wangwangapi", "name": "旺旺API", "baseUrl": "https://api.wwzy.tv/api.php/provide/vod"},
    {"id": "zuidame", "name": "最大点播", "baseUrl": "http://zuidazy.me/api.php/provide/vod"},
    {"id": "yinghua", "name": "樱花资源", "baseUrl": "https://m3u8.apiyhzy.com/api.php/provide/vod"},
    {"id": "bubugao", "name": "步步高资源", "baseUrl": "https://api.yparse.com/api/json"},
    {"id": "niuniu", "name": "牛牛点播", "baseUrl": "https://api.niuniuzy.me/api.php/provide/vod"},
    {"id": "suoni", "name": "索尼资源", "baseUrl": "https://suoniapi.com/api.php/provide/vod"},
    {"id": "maotai", "name": "茅台资源", "baseUrl": "https://caiji.maotaizy.cc/api.php/provide/vod"},
    {"id": "dbzy", "name": "豆瓣资源", "baseUrl": "https://dbzy.tv/api.php/provide/vod"},
    {"id": "subo", "name": "速博资源", "baseUrl": "https://subocaiji.com/api.php/provide/vod"},
    {"id": "jinying", "name": "金鹰点播", "baseUrl": "https://jinyingzy.com/api.php/provide/vod"},
    {"id": "shandian", "name": "閃電资源", "baseUrl": "https://sdzyapi.com/api.php/provide/vod"},
    {"id": "piaoling", "name": "飘零资源", "baseUrl": "https://p2100.net/api.php/provide/vod"},
    {"id": "modudongman", "name": "魔都动漫", "baseUrl": "https://caiji.moduapi.cc/api.php/provide/vod"},
    {"id": "hongniu3", "name": "红牛资源3", "baseUrl": "https://www.hongniuzy3.com/api.php/provide/vod"},
    {"id": "suonisd", "name": "索尼-闪电", "baseUrl": "https://xsd.sdzyapi.com/api.php/provide/vod"}
];

// 动态生成下拉选项
const searchSourceOptions = NORMAL_SOURCES.map(s => ({ title: `🔎 ${s.name}`, value: s.id }));

// ================= 2. 模块元数据定义 =================
WidgetMetadata = {
    id: "vod_search_provider",
    title: "VOD播放引擎",
    description: "专注提供全局搜索与播放源解析，搭配榜单模块食用最佳",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 3600,
    // 【核心亮点】留空模块列表，这样它就不会在你首页产生冗杂的列表框
    modules: [], 
    
    // 【核心亮点】配置全局搜索模块，当 FW 触发搜索时，会自动调用这里
    search: {
        title: "全网资源搜索",
        functionName: "searchVod",
        params: [
            {
                name: "sourceId",
                title: "首选搜索源",
                type: "enumeration",
                value: "feifan", // 默认用非凡，比较稳定
                enumOptions: searchSourceOptions
            },
            {
                name: "keyword", // FW 规范：搜索框输入的词汇会传递给 keyword
                title: "影片名称",
                type: "input"
            }
        ]
    }
};

// ================= 3. 全局搜索处理逻辑 =================
async function searchVod(params) {
    // 兼容 FW 传入的 keyword 或者是有些情况下传入的 wd
    const keyword = params.keyword || params.wd; 
    if (!keyword) return []; // 没有关键词直接返回空

    // 获取用户在 FW 设置中选择的那个源
    const sourceId = params.sourceId || "feifan";
    const siteConfig = NORMAL_SOURCES.find(s => s.id === sourceId) || NORMAL_SOURCES[0];

    console.log(`正在使用 [${siteConfig.name}] 搜索: ${keyword}`);

    try {
        const response = await Widget.http.get(siteConfig.baseUrl, {
            params: {
                ac: "videolist",
                wd: keyword, // CMS 接口要求的关键词参数通常是 wd
                out: "json"  // 强制返回 JSON，防止解析失败
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
            },
            timeout: 8000
        });

        // 解析数据
        let data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
        const list = data.list || [];

        if (list.length === 0) {
            return [{ id: "empty", type: "text", title: "未找到相关影片", description: "试试切换其他【首选搜索源】再搜一次" }];
        }

        // 返回标准视频项目，告诉 FW 准备调用 loadDetail
        return list.map(item => {
            const detailLink = `${siteConfig.id}|${item.vod_id}`;
            return {
                id: detailLink, 
                type: "link", // 关键魔法：type 设为 link，点击后触发 loadDetail
                title: item.vod_name,
                description: item.vod_remarks || item.vod_blurb || "可播放",
                coverUrl: item.vod_pic,
                link: detailLink, 
                subTitle: `🟢 来源: ${siteConfig.name}` // 显示结果来源，方便分辨
            };
        });

    } catch (error) {
        console.error("搜索失败:", error);
        return [{ 
            id: "error", 
            type: "text", 
            title: `[${siteConfig.name}] 请求超时或失效`, 
            description: "请在下拉菜单中切换其他搜索源重试" 
        }];
    }
}

// ================= 4. 解析播放地址处理逻辑 =================
async function loadDetail(link) {
    // 从 link 中拆分出我们存进去的源 ID 和视频 ID
    const parts = link.split("|");
    const sourceId = parts[0];
    const vodId = parts[1];
    const siteConfig = NORMAL_SOURCES.find(s => s.id === sourceId);

    if (!siteConfig) throw new Error("找不到对应的资源源配置");

    try {
        const response = await Widget.http.get(siteConfig.baseUrl, {
            params: {
                ac: "detail",
                ids: vodId,
                out: "json"
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
            },
            timeout: 10000
        });

        let data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
        const item = data.list[0];

        if (!item) throw new Error("未获取到视频详情");

        const playUrls = item.vod_play_url || "";
        const episodes = [];
        const playerGroups = playUrls.split("$$$");
        
        // 优先选择包含 m3u8 的播放线路
        let targetGroup = playerGroups.find(g => g.includes(".m3u8")) || playerGroups[0];
        
        if (targetGroup) {
            const partsList = targetGroup.split("#");
            for (let p of partsList) {
                if (!p) continue;
                const [name, vUrl] = p.split("$");
                if (vUrl) {
                    episodes.push({
                        id: vUrl,
                        type: "url", // 设为 URL，FW 点击就能直接调用原生播放器
                        title: name || "正片",
                        videoUrl: vUrl
                    });
                }
            }
        }

        const cleanDesc = item.vod_content ? item.vod_content.replace(/<[^>]+>/g, "") : "";

        return [{
            id: link,
            type: "link",
            title: item.vod_name,
            description: cleanDesc,
            coverUrl: item.vod_pic,
            genreTitle: `${item.vod_year || ""} • ${item.vod_class || ""}`,
            episodeItems: episodes 
        }];

    } catch (error) {
        console.error("解析详情失败:", error);
        throw error;
    }
}
