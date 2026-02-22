/**
 * VOD 直链播放资源引擎 (原生资源提供者)
 * 规范参考: data-formats.md (type="url" & episodeItems)
 * 核心逻辑: 接收 FW 检索词 -> 搜索 CMS -> 后台直接获取 Detail -> 组装成直链资源返回
 */

// ================= 1. 普通源配置 (56 个) =================
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

// ================= 2. 模块元数据定义 =================
// 我们将模块设定为无 frontend UI 的纯粹后台提供者
WidgetMetadata = {
    id: "vod_direct_stream_provider",
    title: "万能直链资源库",
    description: "作为底层资源提供者，为 TMDB/豆瓣 等榜单无缝提供可播放的视频源",
    author: "编码助手",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    modules: [], // 刻意留空，不产生多余的列表
    search: {
        title: "全网直链资源",
        functionName: "provideStreamResource",
        params: [
            {
                name: "sourceId",
                title: "主力解析源",
                type: "enumeration",
                value: "feifan", // 默认优先从非凡检索
                enumOptions: NORMAL_SOURCES.map(s => ({ title: `🚀 ${s.name}`, value: s.id }))
            },
            {
                name: "keyword", // FW 会自动将 TMDB 的电影名传入此字段
                title: "检索关键词",
                type: "input"
            }
        ]
    }
};

// ================= 3. 核心：边搜索边提取直链的逻辑 =================
async function provideStreamResource(params) {
    const keyword = params.keyword || params.wd;
    if (!keyword) return [];

    const siteConfig = NORMAL_SOURCES.find(s => s.id === (params.sourceId || "feifan")) || NORMAL_SOURCES[0];
    console.log(`[直链引擎] 正在使用 ${siteConfig.name} 检索资源: ${keyword}`);

    try {
        // 第一步：搜索影片
        const searchRes = await Widget.http.get(siteConfig.baseUrl, {
            params: { ac: "videolist", wd: keyword, out: "json" },
            headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" },
            timeout: 8000
        });
        
        let data = typeof searchRes.data === "string" ? JSON.parse(searchRes.data) : searchRes.data;
        const list = data.list || [];
        if (list.length === 0) return [];

        // 第二步：只取前 3 个最匹配的结果进行“后台深度解析” (避免超时)
        const topResults = list.slice(0, 3);
        const finalPlayableItems = [];

        for (let item of topResults) {
            try {
                // 自动请求详情页，获取真正的播放直链
                const detailRes = await Widget.http.get(siteConfig.baseUrl, {
                    params: { ac: "detail", ids: item.vod_id, out: "json" },
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 8000
                });
                
                let detailData = typeof detailRes.data === "string" ? JSON.parse(detailRes.data) : detailRes.data;
                const detailItem = detailData.list[0];
                if (!detailItem) continue;

                // 拆解 CMS 特色的选集字符串
                const playUrls = detailItem.vod_play_url || "";
                const episodes = [];
                const playerGroups = playUrls.split("$$$");
                // 优先选取包含 m3u8 直链的播放组
                let targetGroup = playerGroups.find(g => g.includes(".m3u8")) || playerGroups[0];
                
                if (targetGroup) {
                    const partsList = targetGroup.split("#");
                    for (let p of partsList) {
                        if (!p) continue;
                        const [name, vUrl] = p.split("$");
                        if (vUrl) {
                            // 遵循官方 data-formats.md，构建直链 episodeItem
                            episodes.push({
                                id: vUrl,
                                type: "url",           // 设置为 url，让 FW 知道这是直链
                                title: name || "正片",
                                videoUrl: vUrl         // 填入真正的视频地址
                            });
                        }
                    }
                }

                // 清理简介代码
                const cleanDesc = detailItem.vod_content ? detailItem.vod_content.replace(/<[^>]+>/g, "") : "暂无简介";

                // 第三步：遵循官方数据规范，组装自带选集的 VideoItem
                if (episodes.length > 0) {
                    finalPlayableItems.push({
                        id: `${siteConfig.id}_${item.vod_id}`,
                        type: "url",                   // 核心：直接声明为可播放资源，跳过 link 阶段
                        title: item.vod_name,
                        description: `🟢 [${siteConfig.name}提供] ` + cleanDesc,
                        coverUrl: item.vod_pic,
                        mediaType: episodes.length > 1 ? "tv" : "movie",
                        episodeItems: episodes         // 核心：直接将解析好的选集嵌进去！
                    });
                }
            } catch (err) {
                console.error(`解析 ${item.vod_name} 详情时出错:`, err);
                continue; // 一个结果失败不影响其他结果
            }
        }

        if (finalPlayableItems.length === 0) {
             return [{ id: "error", type: "text", title: "无直链资源", description: "找到结果，但未能成功解析出 m3u8 直链" }];
        }

        return finalPlayableItems;

    } catch (error) {
        console.error("检索直链资源失败:", error);
        return [];
    }
}
