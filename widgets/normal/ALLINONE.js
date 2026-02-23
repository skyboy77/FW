/**
 * 全球电视台与流媒体宇宙 (终极版)
 * 核心逻辑: 动态解除国家锁定，精准匹配全球三十多个流媒体与电视网 ID
 * 涵盖: 国内爱优腾芒、四大卫视、港台本土平台、韩国三大台、以及网飞/HBO等国际巨头
 */

WidgetMetadata = {
    id: "allinone_global_networks",
    title: "🌐 全球影视平台",
    description: "全网最全的频道聚合：覆盖爱优腾、网飞、HBO、韩国tvN及各大卫视",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.1.0", // 🚀 升级：引入防截断与双海报极简排版规范
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "全网热播发现",
            functionName: "loadPlatformList",
            type: "list",
            cacheDuration: 3600,
            params: [
                {
                    name: "platform",
                    title: "选择频道/平台",
                    type: "enumeration",
                    value: "netflix",
                    enumOptions: [
                        { title: "🌟 全球综合热播", value: "all" },
                        // 国际流媒体巨头
                        { title: "🔴 Netflix (网飞)", value: "netflix" },
                        { title: "🟣 HBO", value: "hbo" },
                        { title: "🔵 Disney+ (迪士尼)", value: "disney" },
                        { title: "🍏 Apple TV+", value: "apple" },
                        { title: "📦 Amazon Prime", value: "amazon" },
                        // 国内流媒体
                        { title: "🐧 腾讯视频", value: "tencent" },
                        { title: "🥝 爱奇艺", value: "iqiyi" },
                        { title: "👖 优酷", value: "youku" },
                        { title: "🥭 芒果TV", value: "mango" },
                        { title: "📺 BiliBili", value: "bilibili" },
                        // 国内主流卫视
                        { title: "📡 湖南卫视", value: "hunan" },
                        { title: "📡 浙江卫视", value: "zhejiang" },
                        { title: "📡 东方卫视", value: "dragon" },
                        { title: "📡 CCTV-8", value: "cctv8" },
                        // 港台本土平台
                        { title: "🇭🇰 ViuTV", value: "viutv" },
                        { title: "🇹🇼 LINE TV", value: "linetv" },
                        { title: "🇹🇼 Hami Video", value: "hami" },
                        { title: "🇹🇼 CATCHPLAY", value: "catchplay" },
                        // 韩国电台
                        { title: "🇰🇷 tvN", value: "tvn" },
                        { title: "🇰🇷 SBS", value: "sbs" },
                        { title: "🇰🇷 KBS2", value: "kbs2" },
                        // 其他国际频道
                        { title: "🇺🇸 ABC", value: "abc" },
                        { title: "🌍 国家地理频道", value: "natgeo" },
                        { title: "📱 U mobile TV", value: "umobile" }
                    ]
                },
                {
                    name: "mediaType",
                    title: "影视分类",
                    type: "enumeration",
                    value: "tv",
                    enumOptions: [
                        { title: "📺 纯净剧集 (Drama)", value: "tv" },
                        { title: "🎬 电影 (Movie)", value: "movie" },
                        { title: "🐰 动漫 (Anime)", value: "anime" },
                        { title: "🎤 综艺/真人秀", value: "variety" }
                    ]
                },
                {
                    name: "sortBy",
                    title: "排序方式",
                    type: "enumeration",
                    value: "hot",
                    enumOptions: [
                        { title: "🔥 平台热度榜", value: "hot" },
                        { title: "🆕 最新上线榜", value: "new" },
                        { title: "🏆 TMDB 高分榜", value: "top" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// ================= 1. 核心映射配置 (全球ID库) =================

const PLATFORM_MAP = {
    // 国际巨头
    netflix: { network: "213", provider: "8", region: "US", name: "Netflix" },
    hbo:     { network: "49|3186", provider: "118", region: "US", name: "HBO" },
    disney:  { network: "2739", provider: "337", region: "US", name: "Disney+" },
    apple:   { network: "2552", provider: "350", region: "US", name: "Apple TV+" },
    amazon:  { network: "1024", provider: "119", region: "US", name: "Amazon" },
    // 国内流媒体
    tencent: { network: "2007|3353", provider: "138", region: "CN", name: "腾讯" },
    iqiyi:   { network: "3088|3185", provider: "238", region: "CN", name: "爱奇艺" },
    youku:   { network: "3084", provider: "331", region: "CN", name: "优酷" },
    mango:   { network: "3186", provider: "1944", region: "CN", name: "芒果" },
    bilibili:{ network: "3152|3625", provider: "2280", region: "CN", name: "B站" },
    // 国内卫视 (卫视主要做剧集/综艺，通常无电影 provider)
    hunan:   { network: "952", provider: null, region: "CN", name: "湖南卫视" },
    zhejiang:{ network: "989", provider: null, region: "CN", name: "浙江卫视" },
    dragon:  { network: "1056", provider: null, region: "CN", name: "东方卫视" },
    cctv8:   { network: "521", provider: null, region: "CN", name: "CCTV-8" },
    // 港台平台
    viutv:   { network: "2146", provider: null, region: "HK", name: "ViuTV" },
    linetv:  { network: "1671", provider: null, region: "TW", name: "LINE TV" },
    hami:    { network: "4571", provider: null, region: "TW", name: "Hami" },
    catchplay:{ network: "5002", provider: null, region: "TW", name: "CATCHPLAY" },
    // 韩国电台
    tvn:     { network: "866", provider: null, region: "KR", name: "tvN" },
    sbs:     { network: "156", provider: null, region: "KR", name: "SBS" },
    kbs2:    { network: "342", provider: null, region: "KR", name: "KBS2" },
    // 其他国际
    abc:     { network: "2", provider: null, region: "US", name: "ABC" },
    natgeo:  { network: "43", provider: null, region: "US", name: "国家地理" },
    umobile: { network: "6974", provider: null, region: "US", name: "U mobile" },
    all:     { network: null, provider: null, region: null, name: "综合" }
};

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10764: "真人秀", 10767: "脱口秀"
};

function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ");
}

function buildItem(item, isMovie, platformName) {
    if (!item) return null;
    
    const mediaType = isMovie ? "movie" : "tv";
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无";
    const genreText = getGenreText(item.genre_ids) || "影视";
    
    let typeTag = isMovie ? "🎬" : "📺";
    if (item.genre_ids?.includes(16)) typeTag = "🐰";
    if (item.genre_ids?.includes(10764) || item.genre_ids?.includes(10767)) typeTag = "🎤";

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", 
        mediaType: mediaType,
        title: title,
        
        // 👇 核心排版：利用系统原生截断和拼接
        releaseDate: releaseDate, // 让 fw 去截断/保留
        genreTitle: genreText,    // 横版自动接在日期后面
        subTitle: "",             // 强制置空，告别错位
        
        // 👇 横竖双海报自动支持
        coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", // 竖版海报
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "", // 横版海报
        
        // 平台标识与评分优雅降级到简介
        description: `${typeTag} ${platformName} | ⭐ ${score}\n${item.overview || "暂无简介"}`,
        rating: item.vote_average || 0
    };
}

// ================= 2. 核心请求逻辑 =================

async function loadPlatformList(params) {
    const platform = params.platform || "netflix";
    const mediaType = params.mediaType || "tv";
    const category = params.sortBy || "hot";
    const page = params.page || 1;

    const today = new Date().toISOString().split('T')[0];
    const isMovie = (mediaType === "movie");
    const endpoint = isMovie ? "/discover/movie" : "/discover/tv";
    const platformConfig = PLATFORM_MAP[platform];

    let queryParams = {
        language: "zh-CN",
        page: page
    };

    if (platform !== "all") {
        if (isMovie) {
            if (!platformConfig.provider) {
                return [{ id: "empty", type: "text", title: "无电影分类", description: `电视台 [${platformConfig.name}] 通常不单独作为电影流媒体发行商，请切换为[剧集]或[综艺]重试。` }];
            }
            queryParams.with_watch_providers = platformConfig.provider;
            queryParams.watch_region = platformConfig.region || "US";
        } else {
            queryParams.with_networks = platformConfig.network;
        }
    }

    if (mediaType === "anime") {
        queryParams.with_genres = "16";
    } else if (mediaType === "variety") {
        queryParams.with_genres = "10764|10767";
    } else if (mediaType === "tv") {
        queryParams.without_genres = "16,10764,10767";
    }

    if (category === "hot") {
        queryParams.sort_by = "popularity.desc";
        queryParams["vote_count.gte"] = 2;
    } 
    else if (category === "new") {
        queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        if (isMovie) {
            queryParams["primary_release_date.lte"] = today;
        } else {
            queryParams["first_air_date.lte"] = today;
        }
    } 
    else if (category === "top") {
        queryParams.sort_by = "vote_average.desc";
        queryParams["vote_count.gte"] = 30; 
    }

    try {
        const res = await Widget.tmdb.get(endpoint, { params: queryParams });
        const items = (res.results || []).map(i => buildItem(i, isMovie, platformConfig.name)).filter(Boolean);

        if (items.length === 0) {
             return [{ id: "empty", type: "text", title: "无数据", description: `在 [${platformConfig.name}] 暂未找到符合该条件的影视记录` }];
        }

        return items;

    } catch (error) {
        console.error("加载榜单失败:", error);
        return [{ id: "error", type: "text", title: "网络异常", description: "请求 TMDB 失败，请下拉重试" }];
    }
}
