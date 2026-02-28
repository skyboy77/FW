WidgetMetadata = {
    id: "movie_ultimate_makka_v2",
    title: "全能电影榜",
    description: "提供流行、高分、年度最佳以及按类型探索电影",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.4.0", // 🚀 升级版本：拆分为三个独立模块，每个模块独占右上角下拉菜单
    requiredVersion: "0.0.1",
    modules: [
        // ================= 模块 1：电影综合榜 =================
        {
            title: "电影综合榜",
            functionName: "loadGeneralMovies", // 对应新函数
            type: "video", 
            cacheDuration: 3600,
            params: [
                {
                    name: "sort_by", 
                    title: "榜单分类",
                    type: "enumeration",
                    value: "popular", 
                    enumOptions: [
                        { title: "🔥 流行趋势 (Popular)", value: "popular" },
                        { title: "⭐️ 历史高分 (Top Rated)", value: "top_rated" },
                        { title: "💰 全球票房榜 (Box Office)", value: "box_office" },
                        { title: "🏆 奥斯卡佳片 (Oscar)", value: "oscar" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },
        // ================= 模块 2：年度最佳电影 =================
        {
            title: "年度最佳电影",
            functionName: "loadYearlyBestMovies", // 对应新函数
            type: "video", 
            cacheDuration: 3600,
            params: [
                {
                    name: "sort_by", 
                    title: "选择年份",
                    type: "enumeration",
                    value: "2024",
                    enumOptions: [
                        { title: "2025年 最佳", value: "2025" },
                        { title: "2024年 最佳", value: "2024" },
                        { title: "2023年 最佳", value: "2023" },
                        { title: "2022年 最佳", value: "2022" },
                        { title: "2021年 最佳", value: "2021" },
                        { title: "2020年 最佳", value: "2020" },
                        { title: "2019年 最佳", value: "2019" },
                        { title: "2018年 最佳", value: "2018" },
                        { title: "2017年 最佳", value: "2017" },
                        { title: "2016年 最佳", value: "2016" },
                        { title: "2015年 最佳", value: "2015" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        },
        // ================= 模块 3：按类型探索 =================
        {
            title: "按类型探索",
            functionName: "loadGenreMovies", // 对应新函数
            type: "video", 
            cacheDuration: 3600,
            params: [
                {
                    name: "sort_by", 
                    title: "选择类型",
                    type: "enumeration",
                    value: "878", 
                    enumOptions: [
                        { title: "🛸 科幻 (Sci-Fi)", value: "878" },
                        { title: "🎭 剧情 (Drama)", value: "18" },
                        { title: "🤯 悬疑 (Mystery)", value: "9648" },
                        { title: "💥 动作 (Action)", value: "28" },
                        { title: "😂 喜剧 (Comedy)", value: "35" },
                        { title: "❤️ 爱情 (Romance)", value: "10749" },
                        { title: "👻 恐怖 (Horror)", value: "27" },
                        { title: "🔪 犯罪 (Crime)", value: "80" },
                        { title: "🧙‍♂️ 奇幻 (Fantasy)", value: "14" },
                        { title: "🦄 动画 (Animation)", value: "16" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// ================= 核心工具函数 =================

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险"
};

function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "电影";
    const genres = ids.map(id => GENRE_MAP[id]).filter(Boolean);
    return genres.length > 0 ? genres.slice(0, 2).join(" / ") : "电影";
}

function buildItem(item) {
    if (!item) return null;
    
    const releaseDate = item.release_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
    const genreText = getGenreText(item.genre_ids);

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb",
        mediaType: "movie",
        title: item.title,
        genreTitle: genreText,
        description: releaseDate ? `${releaseDate} · ⭐ ${score}` : `⭐ ${score}`,
        releaseDate: releaseDate,
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
        rating: parseFloat(score)
    };
}

// ================= 逻辑处理部分 (拆分为3个独立函数) =================

// 1. 处理【电影综合榜】
async function loadGeneralMovies(params) {
    const sort_by = params.sort_by || "popular"; 
    const page = params.page || 1;
    try {
        let endpoint = "";
        let queryParams = { language: "zh-CN", page: page };

        if (sort_by === "popular") {
            endpoint = "/movie/popular";
        } else if (sort_by === "top_rated") {
            endpoint = "/movie/top_rated";
        } else if (sort_by === "box_office") {
            endpoint = "/discover/movie";
            queryParams.sort_by = "revenue.desc";
        } else if (sort_by === "oscar") {
            endpoint = "/discover/movie";
            queryParams.with_keywords = "818";
            queryParams.sort_by = "vote_average.desc";
            queryParams["vote_count.gte"] = 1000;
        }

        const res = await Widget.tmdb.get(endpoint, { params: queryParams });
        return (res.results || []).map(i => buildItem(i)).filter(Boolean);
    } catch (error) { return handleError(); }
}

// 2. 处理【年度最佳电影】
async function loadYearlyBestMovies(params) {
    // 这里的 sort_by 接收到的是年份 (如 "2024")
    const targetYear = params.sort_by || "2024"; 
    const page = params.page || 1;
    try {
        let queryParams = { 
            language: "zh-CN", 
            page: page,
            primary_release_year: targetYear,
            sort_by: "vote_average.desc",
            "vote_count.gte": 500 
        };
        const res = await Widget.tmdb.get("/discover/movie", { params: queryParams });
        return (res.results || []).map(i => buildItem(i)).filter(Boolean);
    } catch (error) { return handleError(); }
}

// 3. 处理【按类型探索】
async function loadGenreMovies(params) {
    // 这里的 sort_by 接收到的是类型ID (如 "878")
    const targetGenre = params.sort_by || "878"; 
    const page = params.page || 1;
    try {
        let queryParams = { 
            language: "zh-CN", 
            page: page,
            with_genres: targetGenre,
            sort_by: "popularity.desc"
        };
        const res = await Widget.tmdb.get("/discover/movie", { params: queryParams });
        return (res.results || []).map(i => buildItem(i)).filter(Boolean);
    } catch (error) { return handleError(); }
}

// 错误处理小工具
function handleError() {
    return [{
        id: "error", type: "text", title: "加载异常", description: "网络开小差了，请下拉刷新重试"
    }];
}
