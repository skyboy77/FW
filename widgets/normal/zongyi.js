WidgetMetadata = {
    id: "variety_hub_ultimate_v4_fix",
    title: "全球综艺追更热度榜",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "综艺更新时间表，热度榜",
    version: "2.0.4", // 更新版本号
    requiredVersion: "0.0.1",
    site: "https://www.themoviedb.org",

    modules: [
        {
            title: "综艺聚合",
            functionName: "loadVarietyUltimate",
            type: "list", // 此处横竖版切换测试均可兼容
            cacheDuration: 300, 
            params: [
                {
                    name: "listType",
                    title: "榜单类型",
                    type: "enumeration",
                    value: "calendar",
                    enumOptions: [
                        { title: "📅 追新榜 (未来排期)", value: "calendar" },
                        { title: "🔥 热度榜 (按流行度)", value: "hot" }
                    ]
                },
                {
                    name: "days",
                    title: "预告范围",
                    type: "enumeration",
                    value: "14",
                    belongTo: { paramName: "listType", value: ["calendar"] },
                    enumOptions: [
                        { title: "未来 7 天", value: "7" },
                        { title: "未来 14 天", value: "14" },
                        { title: "未来 30 天", value: "30" }
                    ]
                },
                {
                    name: "region",
                    title: "地区筛选",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌏 全部地区", value: "all" },
                        { title: "🇨🇳 国内综艺", value: "cn" },
                        { title: "✈️ 国外综艺", value: "global" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

// =========================================================================
// 0. 工具函数
// =========================================================================

// 辅助函数：将个位数补零，例如 1 -> 01
function padZero(num) {
    return String(num).padStart(2, '0');
}

// 获取今天 (YYYY-MM-DD) - 用于比较
function getTodayStr() {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().split('T')[0];
}

// 获取 N 天后的日期
function getFutureDateStr(days) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(days));
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().split('T')[0];
}

// =========================================================================
// 1. 核心逻辑
// =========================================================================

async function loadVarietyUltimate(params = {}) {
    const { listType = "calendar", region = "all", days = "14", page = 1 } = params;

    const todayStr = getTodayStr(); // 获取今天的日期字符串 (2026-02-23)

    let discoverUrl = `/discover/tv`;
    let queryParams = {
        language: "zh-CN",
        page: page,
        with_genres: "10764|10767", 
        sort_by: "popularity.desc",
        "vote_count.gte": 0,
        include_null_first_air_dates: false
    };

    if (region === "cn") {
        queryParams.with_origin_country = "CN";
    } else if (region === "global") {
        queryParams.with_origin_country = "US|KR|JP|GB|TW|HK|TH";
    }

    // === 📅 步骤1：初步筛选 ===
    if (listType === "calendar") {
        const endDate = getFutureDateStr(days);
        // API 查询时，gte 设为今天
        queryParams["air_date.gte"] = todayStr;
        queryParams["air_date.lte"] = endDate;
    }

    try {
        const res = await Widget.tmdb.get(discoverUrl, { params: queryParams });
        const rawResults = res.results || [];

        if (rawResults.length === 0) return [];

        const detailPromises = rawResults.map(async (item) => {
            if (!item.poster_path) return null;

            try {
                const detail = await Widget.tmdb.get(`/tv/${item.id}`, { 
                    params: { language: "zh-CN" } 
                });
                
                const nextEp = detail.next_episode_to_air;
                const lastEp = detail.last_episode_to_air;
                
                let sortDate = "1900-01-01"; 
                let epString = ""; 

                // 逻辑：找到最接近未来的那一集，并组装 S01-E03
                if (nextEp) {
                    sortDate = nextEp.air_date;
                    epString = `S${padZero(nextEp.season_number)}-E${padZero(nextEp.episode_number)}`;
                } else if (lastEp) {
                    sortDate = lastEp.air_date;
                    epString = `S${padZero(lastEp.season_number)}-E${padZero(lastEp.episode_number)}`;
                } else {
                    sortDate = item.first_air_date;
                    epString = "首播";
                }

                // === 🛑 步骤2：最终强制过滤 ===
                if (listType === "calendar") {
                    if (!sortDate || sortDate < todayStr) {
                        return null; 
                    }
                }

                return {
                    detail: detail,
                    sortDate: sortDate,
                    epString: epString
                };
            } catch (e) {
                return null;
            }
        });

        const detailedItems = (await Promise.all(detailPromises)).filter(Boolean);

        // === 📅 步骤3：排序 (今天 -> 未来) ===
        if (listType === "calendar") {
            detailedItems.sort((a, b) => {
                if (a.sortDate === b.sortDate) return 0;
                return a.sortDate > b.sortDate ? 1 : -1; 
            });
        }

        return detailedItems.map(data => {
            const { detail, epString, sortDate } = data;
            
            const ratingNum = detail.vote_average ? detail.vote_average.toFixed(1) : "0.0";
            const ratingText = ratingNum > 0 ? `${ratingNum}分` : "暂无评分";
            
            let finalSubTitle = "";

            if (listType === "calendar") {
                // 生成副标题：8.5分 • S01-E03
                finalSubTitle = `${ratingText} • ${epString}`;  
            } else {
                // 热度榜副标题
                finalSubTitle = `${ratingText} • 热度 ${Math.round(detail.popularity)}`;
            }

            // 提取年份，用当前播出的这集的年份
            const yearStr = sortDate ? sortDate.substring(0, 4) : (detail.first_air_date || "").substring(0, 4);

            return {
                id: String(detail.id),
                tmdbId: detail.id,
                type: "tmdb",
                mediaType: "tv",
                title: detail.name || detail.original_name,
                
                // 给横版的副标题
                genreTitle: finalSubTitle, 
                subTitle: finalSubTitle,
                
                posterPath: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : "",
                backdropPath: detail.backdrop_path ? `https://image.tmdb.org/t/p/w780${detail.backdrop_path}` : "",
                description: `📅 播出时间: ${sortDate}\n${detail.overview || "暂无简介"}`,
                rating: parseFloat(ratingNum),
                
                // 核心字段回归
                year: yearStr,           // 负责横版榜单前面拼接的年份："2026"
                releaseDate: sortDate    // 负责竖版海报下方显示的完整日期："2026-02-23"
            };
        });

    } catch (e) {
        return [{ id: "err", type: "text", title: "加载失败", subTitle: e.message }];
    }
}
