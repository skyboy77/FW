WidgetMetadata = {
    id: "movie_ultimate_makka_v2",
    title: "全能电影榜",
    description: "提供流行、高分、年度最佳以及按类型探索电影",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.0.1", // 版本号小幅升级
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "电影榜单",
            functionName: "loadMovieList",
            type: "list",
            cacheDuration: 3600,
            params: [
                // --- 一级菜单：主分类 ---
                {
                    name: "category",
                    title: "榜单分类",
                    type: "enumeration",
                    value: "popular", // 默认显示流行榜
                    enumOptions: [
                        { title: "🔥 流行趋势 (Popular)", value: "popular" },
                        { title: "⭐️ 历史高分 (Top Rated)", value: "top_rated" },
                        { title: "💰 全球票房榜 (Box Office)", value: "box_office" },
                        { title: "🏆 奥斯卡佳片 (Oscar)", value: "oscar" },
                        { title: "🎬 年度最佳电影", value: "best_of_years" },
                        { title: "🏷️ 按类型探索", value: "by_genre" }
                    ]
                },
                // --- 二级菜单 A：年份选择 (仅在选中“年度最佳”时出现) ---
                {
                    name: "year",
                    title: "选择年份",
                    type: "enumeration",
                    value: "2024",
                    belongTo: { paramName: "category", value: ["best_of_years"] },
                    enumOptions: [
                        { title: "2025", value: "2025" },
                        { title: "2024", value: "2024" },
                        { title: "2023", value: "2023" },
                        { title: "2022", value: "2022" },
                        { title: "2021", value: "2021" },
                        { title: "2020", value: "2020" },
                        { title: "2019", value: "2019" },
                        { title: "2018", value: "2018" },
                        { title: "2017", value: "2017" },
                        { title: "2016", value: "2016" },
                        { title: "2015", value: "2015" }
                    ]
                },
                // --- 二级菜单 B：类型选择 (仅在选中“按类型探索”时出现) ---
                {
                    name: "genre",
                    title: "选择类型",
                    type: "enumeration",
                    value: "878", // 默认科幻
                    belongTo: { paramName: "category", value: ["by_genre"] },
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
                // --- 翻页组件 ---
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// ================= 逻辑处理部分 =================

// 类型映射表
const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险"
};

// 提取类型的中文名称
function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    // 最多取前 3 个类型，用 " / " 分隔，保持 UI 干净
    return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ");
}

// 统一的数据格式化函数 (核心修复区)
function buildItem(item) {
    if (!item) return null;
    
    // 提取完整日期 (YYYY-MM-DD) 和 年份 (YYYY)
    const releaseDate = item.release_date || "";
    const year = releaseDate.substring(0, 4);
    
    const score = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
    const genreText = getGenreText(item.genre_ids);

    // 组合副标题：兼顾图1(日期)与图3(类型)的需求，例如 "2026-01-16 · 科幻 / 动作"
    // 如果没有日期，就只显示类型
    const subTitleText = releaseDate ? `${releaseDate} · ${genreText}` : genreText;

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb",
        mediaType: "movie",
        title: item.title,
        
        // 【关键修复 1】统一规范化副标题，使横竖版都能清晰看到播出时间与类型
        subTitle: subTitleText,
        
        // 【关键修复 2】竖版海报字段 (w500分辨率兼顾清晰与加载速度)
        coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
        
        // 【关键修复 3】将 backdropPath 更正为 Forward 标准字段 backdropUrl
        // 这样当 UI 切换为横版时，引擎会自动抓取这张横向剧照，不再拉伸
        backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
        
        description: item.overview,
        rating: parseFloat(score),
        year: year
    };
}

// 主请求函数
async function loadMovieList(params) {
    const category = params.category || "popular";
    const page = params.page || 1;

    try {
        let endpoint = "";
        let queryParams = { 
            language: "zh-CN", 
            page: page 
        };

        // 根据下拉菜单的选择，动态匹配请求参数
        if (category === "popular") {
            endpoint = "/movie/popular";
        } else if (category === "top_rated") {
            endpoint = "/movie/top_rated";
        } else if (category === "box_office") {
            endpoint = "/discover/movie";
            queryParams.sort_by = "revenue.desc";
        } else if (category === "oscar") {
            endpoint = "/discover/movie";
            queryParams.with_keywords = "818";
            queryParams.sort_by = "vote_average.desc";
            queryParams["vote_count.gte"] = 1000;
        } else if (category === "best_of_years") {
            const targetYear = params.year || "2024";
            endpoint = "/discover/movie";
            queryParams.primary_release_year = targetYear;
            queryParams.sort_by = "vote_average.desc";
            queryParams["vote_count.gte"] = 500; 
        } else if (category === "by_genre") {
            const targetGenre = params.genre || "878";
            endpoint = "/discover/movie";
            queryParams.with_genres = targetGenre;
            queryParams.sort_by = "popularity.desc"; 
        }

        const res = await Widget.tmdb.get(endpoint, { params: queryParams });
        
        const items = (res.results || []).map(i => buildItem(i)).filter(Boolean);
        return items;

    } catch (error) {
        console.error("数据请求异常:", error);
        return [{
            id: "error",
            type: "text",
            title: "加载异常",
            description: "网络开小差了，请下拉刷新重试"
        }];
    }
}
