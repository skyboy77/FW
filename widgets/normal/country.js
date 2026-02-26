WidgetMetadata = {
    id: "global_genre_hub_country",
    title: "全球类型精选",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "强大的多维度影视筛选，支持按类型、国家、排序规则发现好剧好片。",
    version: "1.0.1", // 更新了版本号
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "🏷️ 高级类型榜单",
            functionName: "loadGenreRank",
            type: "video", 
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
                // ✨ 修复 1：显式声明 startPage 为 1，引导内核正确触发分页
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// =========================================================================
// 2. 核心业务逻辑 (Handler Functions)
// =========================================================================

const GENRE_MAP = {
    "scifi": { movie: "878", tv: "10765" },       
    "mystery": { movie: "9648", tv: "9648" },
    "horror": { movie: "27", tv: "27" },          
    "crime": { movie: "80", tv: "80" },
    "action": { movie: "28", tv: "10759" },       
    "comedy": { movie: "35", tv: "35" },
    "romance": { movie: "10749", tv: "10749" },   
    "drama": { movie: "18", tv: "18" },
    "fantasy": { movie: "14", tv: "10765" },      
    "animation": { movie: "16", tv: "16" },
    "documentary": { movie: "99", tv: "99" }
};

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

async function loadGenreRank(params = {}) {
    // ✨ 修复 2：强制将传入的 page 转换为整数，防止内核传字符串导致分页失效
    const page = parseInt(params.page) || 1;
    
    // ✨ 添加调试日志：让你能在控制台清楚看到有没有触发下一页
    console.log(`[GenreHub] 正在请求第 ${page} 页的数据...`);

    const { mediaType = "movie", genre = "scifi", region = "all", sortBy = "popularity" } = params;

    const genreId = GENRE_MAP[genre] ? GENRE_MAP[genre][mediaType] : "";
    const originCountry = REGION_MAP[region] || "";

    let tmdbSortBy = "popularity.desc";
    if (sortBy === "rating") {
        tmdbSortBy = "vote_average.desc";
    } else if (sortBy === "time") {
        tmdbSortBy = mediaType === "movie" ? "primary_release_date.desc" : "first_air_date.desc";
    }

    const queryParams = {
        language: "zh-CN",
        page: page,
        sort_by: tmdbSortBy,
        include_adult: false,
        include_video: false
    };

    if (genreId) queryParams.with_genres = genreId;
    if (originCountry) queryParams.with_origin_country = originCountry;

    if (sortBy === "rating") {
        queryParams["vote_count.gte"] = 200; 
    } else {
        queryParams["vote_count.gte"] = 10; 
    }

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
        const res = await Widget.tmdb.get(`/discover/${mediaType}`, { params: queryParams });
        const items = res.results || [];

        if (items.length === 0) {
            return page === 1 ? [{ id: "empty", type: "text", title: "未找到符合条件的影视", description: "请尝试更换国家或类型" }] : [];
        }

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
