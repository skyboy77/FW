// =========================================================================
// 1. Widget Metadata (组件元数据)
// =========================================================================

WidgetMetadata = {
    id: "global_genre_hub",
    title: "全球类型精选",
    author: "编码助手",
    description: "强大的多维度影视筛选，支持按类型、国家、排序规则发现好剧好片。",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "🏷️ 高级类型榜单",
            functionName: "loadGenreRank",
            type: "video", // 推荐使用 video 竖版海报流
            cacheDuration: 3600,
            params: [
                {
                    name: "mediaType",
                    title: "影视类型",
                    type: "enumeration",
                    value: "movie",
                    enumOptions: [
                        { title: "🎬 电影 (Movie)", value: "movie" },
                        { title: "📺 电视剧 (TV)", value: "tv" }
                    ]
                },
                {
                    name: "genre",
                    title: "题材流派",
                    type: "enumeration",
                    value: "scifi",
                    enumOptions: [
                        { title: "🛸 科幻 (Sci-Fi)", value: "scifi" },
                        { title: "🔍 悬疑 (Mystery)", value: "mystery" },
                        { title: "👻 恐怖 (Horror)", value: "horror" },
                        { title: "🔪 犯罪 (Crime)", value: "crime" },
                        { title: "💥 动作 (Action)", value: "action" },
                        { title: "😂 喜剧 (Comedy)", value: "comedy" },
                        { title: "❤️ 爱情 (Romance)", value: "romance" },
                        { title: "🎭 剧情 (Drama)", value: "drama" },
                        { title: "🐉 奇幻 (Fantasy)", value: "fantasy" },
                        { title: "🎨 动画 (Animation)", value: "animation" },
                        { title: "🎥 纪录片 (Documentary)", value: "documentary" }
                    ]
                },
                {
                    name: "region",
                    title: "国家/地区",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { title: "🌍 全球 (所有国家)", value: "all" },
                        { title: "🇨🇳 中国大陆", value: "cn" },
                        { title: "🇭🇰 中国香港", value: "hk" },
                        { title: "🇹🇼 中国台湾", value: "tw" },
                        { title: "🏮 港台 (香港+台湾)", value: "hktw" },
                        { title: "🇯🇵 日本", value: "jp" },
                        { title: "🇰🇷 韩国", value: "kr" },
                        { title: "🌸 日韩合集", value: "jpkr" },
                        { title: "🇹🇭 泰国", value: "th" },
                        { title: "🇸🇬 新加坡", value: "sg" },
                        { title: "🇲🇾 马来西亚", value: "my" },
                        { title: "🇮🇳 印度", value: "in" },
                        { title: "🌏 亚太大区", value: "apac" },
                        { title: "🇺🇸 美国", value: "us" },
                        { title: "🇬🇧 英国", value: "gb" },
                        { title: "🇩🇪 德国", value: "de" },
                        { title: "🇸🇪 瑞典", value: "se" },
                        { title: "🇪🇺 欧洲全境", value: "europe" },
                        { title: "🇪🇸 西班牙", value: "es" },
                        { title: "🇲🇽 墨西哥", value: "mx" },
                        { title: "💃 西语/拉丁美洲", value: "latin" }
                    ]
                },
                {
                    name: "sortBy",
                    title: "排序规则",
                    type: "enumeration",
                    value: "popularity",
                    enumOptions: [
                        { title: "🔥 热门趋势", value: "popularity" },
                        { title: "⭐ 评分最高", value: "rating" },
                        { title: "📅 最新上线", value: "time" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

// =========================================================================
// 2. 核心业务逻辑 (Handler Functions)
// =========================================================================

// 影视流派在 TMDB 中的 ID 映射表 (电影和剧集的 ID 略有不同)
const GENRE_MAP = {
    "scifi": { movie: "878", tv: "10765" },       // 电影:科幻 | 剧集:科幻&奇幻
    "mystery": { movie: "9648", tv: "9648" },
    "horror": { movie: "27", tv: "27" },          // 注意：TMDB 的剧集较少使用纯恐怖标签，但 27 通用
    "crime": { movie: "80", tv: "80" },
    "action": { movie: "28", tv: "10759" },       // 电影:动作 | 剧集:动作&冒险
    "comedy": { movie: "35", tv: "35" },
    "romance": { movie: "10749", tv: "10749" },   // 剧集其实很少用这个，多用剧情
    "drama": { movie: "18", tv: "18" },
    "fantasy": { movie: "14", tv: "10765" },      // 电影:奇幻 | 剧集:合并在科幻&奇幻中
    "animation": { movie: "16", tv: "16" },
    "documentary": { movie: "99", tv: "99" }
};

// 国家/地区 ISO 3166-1 映射表 (多国家用 | 隔开表示“或”)
const REGION_MAP = {
    "all": "",
    "cn": "CN",
    "hk": "HK",
    "tw": "TW",
    "hktw": "HK|TW",
    "jp": "JP",
    "kr": "KR",
    "jpkr": "JP|KR",
    "th": "TH",
    "sg": "SG",
    "my": "MY",
    "in": "IN",
    "apac": "CN|HK|TW|JP|KR|TH|SG|MY|IN",
    "us": "US",
    "gb": "GB",
    "de": "DE",
    "se": "SE",
    "europe": "GB|DE|FR|IT|ES|SE|NO|DK|FI|NL|BE|CH|AT|IE",
    "es": "ES",
    "mx": "MX",
    "latin": "ES|MX|AR|CO|CL|PE|VE"
};

/**
 * 主获取函数
 */
async function loadGenreRank(params = {}) {
    const { mediaType = "movie", genre = "scifi", region = "all", sortBy = "popularity" } = params;
    const page = params.page || 1;

    // 1. 获取对应的 Genre ID
    const genreId = GENRE_MAP[genre] ? GENRE_MAP[genre][mediaType] : "";

    // 2. 获取对应的地区代码
    const originCountry = REGION_MAP[region] || "";

    // 3. 处理排序规则
    let tmdbSortBy = "popularity.desc";
    if (sortBy === "rating") {
        tmdbSortBy = "vote_average.desc";
    } else if (sortBy === "time") {
        // 电影用 release_date，剧集用 first_air_date
        tmdbSortBy = mediaType === "movie" ? "primary_release_date.desc" : "first_air_date.desc";
    }

    // 4. 构建 TMDB Discover 请求参数
    const queryParams = {
        language: "zh-CN",
        page: page,
        sort_by: tmdbSortBy,
        include_adult: false,
        include_video: false
    };

    // 只有当 genreId 存在时才添加 (防护)
    if (genreId) {
        queryParams.with_genres = genreId;
    }

    // 只有当 region 不是全平时才添加
    if (originCountry) {
        queryParams.with_origin_country = originCountry;
    }

    // ⭐ 质量防雷：如果是按评分排序，强制要求至少有 200 人评分过
    if (sortBy === "rating") {
        queryParams["vote_count.gte"] = 200; 
    } else {
        // 其他排序稍微过滤掉毫无知名度的垃圾数据
        queryParams["vote_count.gte"] = 10; 
    }

    // ⭐ 时间防雷：如果是按时间最新排序，限制时间不超过未来的一个月，防止查到几年后才上映的占位假数据
    if (sortBy === "time") {
        const today = new Date();
        today.setMonth(today.getMonth() + 1);
        const maxDate = today.toISOString().split('T')[0];
        
        if (mediaType === "movie") {
            queryParams["primary_release_date.lte"] = maxDate;
        } else {
            queryParams["first_air_date.lte"] = maxDate;
        }
    }

    try {
        // 5. 发起请求
        const res = await Widget.tmdb.get(`/discover/${mediaType}`, { params: queryParams });
        const items = res.results || [];

        if (items.length === 0) {
            return page === 1 ? [{ id: "empty", type: "text", title: "未找到符合条件的影视", description: "请尝试更换国家或类型" }] : [];
        }

        // 6. 格式化数据并返回
        return items.map(item => {
            const date = item.release_date || item.first_air_date || "";
            const year = date ? date.substring(0, 4) : "未知";
            const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无评分";
            
            return {
                id: String(item.id),
                tmdbId: parseInt(item.id),
                type: "tmdb",
                mediaType: mediaType,
                title: item.title || item.name,
                
                // 拼接副标题和简介，使其适应横/竖版 UI
                subTitle: `⭐ ${score} | ${year}`,
                description: `${date} · ⭐ ${score}\n${item.overview || "暂无简介"}`,
                releaseDate: date,
                year: year,
                
                posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
                backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
                rating: parseFloat(score) || 0
            };
        });

    } catch (error) {
        console.error("加载榜单失败:", error);
        return [{ id: "err", type: "text", title: "加载失败", description: "网络连接异常，请重试" }];
    }
}
