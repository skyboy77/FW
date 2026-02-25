/**
 * 全球万能影视专区
 * 核心逻辑: 利用 TMDB discover 接口，动态切换制片国家/地区和语言
 * 支持：大陆、港台、欧美、日韩、拉美等十几个国家地区的影剧分类与混合排序
 */

WidgetMetadata = {
    id: "global_series_makka",
    title: "全球影视专区",
    description: "自由切换全球十几个国家与地区，探索纯正的本土电影与剧集",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.1.0", // 🚀 修复：更换为 video 类型并使用 posterPath，完美适配二级页面自适应排版
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "全球探索发现",
            functionName: "loadGlobalList",
            type: "video", // 🔑 真凶 1 解决：将 "list" 改为 "video"，唤醒框架智能 UI 切换逻辑
            cacheDuration: 3600,
            params: [
                {
                    name: "region",
                    title: "选择国家/地区",
                    type: "enumeration",
                    value: "CN",
                    enumOptions: [
                        { title: "🇨🇳 大陆 (Mainland China)", value: "CN" },
                        { title: "🇭🇰 香港 (Hong Kong)", value: "HK" },
                        { title: "🇹🇼 台湾 (Taiwan)", value: "TW" },
                        { title: "🇺🇸 美国 (United States)", value: "US" },
                        { title: "🇬🇧 英国 (United Kingdom)", value: "GB" },
                        { title: "🇯🇵 日本 (Japan)", value: "JP" },
                        { title: "🇰🇷 韩国 (South Korea)", value: "KR" },
                        { title: "🇪🇺 欧洲综合 (法/德/意/荷)", value: "EU" },
                        { title: "💃 西语世界 (西班牙/拉美)", value: "ES_LANG" },
                        { title: "🇲🇽 墨西哥 (Mexico)", value: "MX" },
                        { title: "🇸🇪 瑞典 (Sweden)", value: "SE" },
                        { title: "🇮🇳 印度 (India)", value: "IN" },
                        { title: "🇹🇭 泰国 (Thailand)", value: "TH" }
                    ]
                },
                {
                    name: "mediaType",
                    title: "影视类型",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌟 全部 (影+剧混合)", value: "all" },
                        { title: "🎬 仅看电影 (Movie)", value: "movie" },
                        { title: "📺 仅看剧集 (TV)", value: "tv" }
                    ]
                },
                {
                    name: "category",
                    title: "排序榜单",
                    type: "enumeration",
                    value: "hot",
                    enumOptions: [
                        { title: "🔥 近期热播榜", value: "hot" },
                        { title: "🆕 最新上线榜", value: "new" },
                        { title: "🏆 历史高分榜", value: "top" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// ================= 辅助函数 =================

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险"
};

function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ");
}

// 统一的数据格式化函数
function buildItem(item, forceMediaType) {
    if (!item) return null;
    
    const mediaType = forceMediaType || item.media_type || (item.title ? "movie" : "tv");
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || ""; // 提取完整日期
    const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无";
    const genreText = getGenreText(item.genre_ids) || "影视";
    
    const typeTag = mediaType === "movie" ? "🎬电影" : "📺剧集";

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", 
        mediaType: mediaType,
        title: title,
        
        // 排版逻辑保持不变，交给框架
        releaseDate: releaseDate, 
        genreTitle: genreText,    
        subTitle: "",             
        
        // 🔑 真凶 2 解决：彻底抛弃 coverUrl，严格使用 posterPath
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "", // 竖版海报
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "", // 横版海报
        
        // 竖版显示在底部的灰色小字
        description: `${typeTag} | ⭐ ${score}\n${item.overview || "暂无简介"}`,
        rating: item.vote_average || 0,
        
        _popularity: item.popularity || 0,
        _date: releaseDate || "1970-01-01"
    };
}

// ================= 主请求逻辑 =================

async function fetchFromTmdb(endpoint, category, page, regionKey) {
    const today = new Date().toISOString().split('T')[0];
    
    let queryParams = {
        language: "zh-CN",
        page: page
    };

    if (regionKey === "ES_LANG") {
        queryParams.with_original_language = "es";
    } else if (regionKey === "EU") {
        queryParams.with_origin_country = "FR|DE|IT|NL|DK|NO|FI"; 
    } else {
        queryParams.with_origin_country = regionKey;
    }

    const isMovie = endpoint.includes("movie");

    if (category === "hot") {
        queryParams.sort_by = "popularity.desc";
        queryParams["vote_count.gte"] = 5; 
    } 
    else if (category === "new") {
        queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        if (isMovie) {
            queryParams["primary_release_date.lte"] = today;
        } else {
            queryParams["first_air_date.lte"] = today;
        }
        queryParams["vote_count.gte"] = 1;
    } 
    else if (category === "top") {
        queryParams.sort_by = "vote_average.desc";
        queryParams["vote_count.gte"] = isMovie ? 50 : 20; 
    }

    const res = await Widget.tmdb.get(endpoint, { params: queryParams });
    const mediaType = isMovie ? "movie" : "tv";
    return (res.results || []).map(i => buildItem(i, mediaType)).filter(Boolean);
}

async function loadGlobalList(params) {
    const region = params.region || "CN";
    const mediaType = params.mediaType || "all";
    const category = params.category || "hot";
    const page = params.page || 1;

    try {
        let items = [];

        if (mediaType === "all") {
            const [movies, tvs] = await Promise.all([
                fetchFromTmdb("/discover/movie", category, page, region),
                fetchFromTmdb("/discover/tv", category, page, region)
            ]);
            
            items = [...movies, ...tvs];

            items.sort((a, b) => {
                if (category === "hot") {
                    return b._popularity - a._popularity; 
                } else if (category === "new") {
                    return new Date(b._date) - new Date(a._date); 
                } else if (category === "top") {
                    return b.rating - a.rating; 
                }
                return 0;
            });
            
            items = items.slice(0, 20);

        } else {
            const endpoint = mediaType === "movie" ? "/discover/movie" : "/discover/tv";
            items = await fetchFromTmdb(endpoint, category, page, region);
        }

        if (items.length === 0) {
             return [{ id: "empty", type: "text", title: "无数据", description: "该区域下暂无满足条件的影片" }];
        }

        return items;

    } catch (error) {
        console.error("数据请求异常:", error);
        return [{ id: "error", type: "text", title: "网络异常", description: "请下拉刷新重试" }];
    }
}
