WidgetMetadata = {
    id: "platform.originals.ui.fix",
    title: "流媒体·独家原创",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "发现Netflix/HBO/腾讯/B站等平台自制内容",
    version: "1.0.6", // 🚀 升级版本号：将平台选择移至右上角下拉菜单
    requiredVersion: "0.0.1",
    site: "https://www.themoviedb.org",

    globalParams: [],

    modules: [
        {
            title: "独家原创",
            functionName: "loadPlatformOriginals",
            type: "video", // 升级为 video 模式，海报展示更美观
            cacheDuration: 3600,
            params: [
                {
                    // 👈 核心修改：将 network 改为 sort_by 以触发右上角下拉菜单
                    name: "sort_by",
                    title: "出品平台",
                    type: "enumeration",
                    value: "213",
                    enumOptions: [
                        { title: "Netflix (网飞)", value: "213" },
                        { title: "HBO (Max)", value: "49" },
                        { title: "Apple TV+", value: "2552" },
                        { title: "Disney+", value: "2739" },
                        { title: "Amazon Prime", value: "1024" },
                        { title: "Hulu", value: "453" },
                        { title: "腾讯视频", value: "2007" },
                        { title: "爱奇艺", value: "1330" },
                        { title: "优酷", value: "1419" },
                        { title: "芒果TV", value: "1631" },
                        { title: "Bilibili", value: "1605" }
                    ]
                },
                {
                    name: "genre",
                    title: "叠加类型",
                    type: "enumeration",
                    value: "",
                    enumOptions: [
                        { title: "全部", value: "" },
                        { title: "剧情", value: "18" },
                        { title: "科幻/奇幻", value: "10765" },
                        { title: "动画", value: "16" },
                        { title: "喜剧", value: "35" },
                        { title: "动作/冒险", value: "10759" },
                        { title: "犯罪", value: "80" },
                        { title: "悬疑", value: "9648" },
                        { title: "纪录片", value: "99" }
                    ]
                },
                {
                    name: "sortBy",
                    title: "排序方式",
                    type: "enumeration",
                    value: "popularity.desc",
                    enumOptions: [
                        { title: "🔥 近期热度", value: "popularity.desc" },
                        { title: "⭐ 历史评分", value: "vote_average.desc" },
                        { title: "📅 最新首播", value: "first_air_date.desc" }
                    ]
                },
                // 必须显式声明 page 参数，Forward 才会启用分页机制
                {
                    name: "page",
                    title: "页码",
                    type: "page"
                }
            ]
        }
    ]
};

const GENRE_MAP = {
    10759: "动作冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 10762: "儿童", 9648: "悬疑", 10763: "新闻",
    10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧", 10767: "脱口秀",
    10768: "战争政治", 37: "西部"
};

async function loadPlatformOriginals(params = {}) {
    // 👈 逻辑接管：从 sort_by 中提取平台 network ID
    const network = params.sort_by || "213";
    const { genre = "", sortBy = "popularity.desc" } = params;
    // 获取分页参数，默认为 1
    const page = params.page || 1;

    const queryParams = {
        language: "zh-CN",
        include_adult: false,
        include_null_first_air_dates: false,
        page: page, // 传入动态页码
        with_networks: network, // 使用接管的平台ID
        sort_by: sortBy
    };

    if (genre) queryParams.with_genres = genre;
    if (sortBy.includes("vote_average")) queryParams["vote_count.gte"] = 200;

    try {
        const res = await Widget.tmdb.get("/discover/tv", { params: queryParams });
        const data = res || {};

        if (!data.results || data.results.length === 0) {
            // 如果第一页就没数据，返回提示；如果是翻页到底了，返回空数组即可
            return page === 1 ? [{ id: "empty", title: "无数据", type: "text" }] : [];
        }

        return data.results.map(item => {
            const genreNames = (item.genre_ids || [])
                .map(id => GENRE_MAP[id])
                .filter(Boolean)
                .slice(0, 3)
                .join(" / ");
            
            const fullDate = item.first_air_date || ""; // 获取完整日期
            const year = fullDate.substring(0, 4);
            const score = item.vote_average ? item.vote_average.toFixed(1) : "0.0";

            return {
                id: String(item.id),
                tmdbId: parseInt(item.id),
                type: "tmdb",
                mediaType: "tv", // 流媒体自制多数是剧集
                title: item.name || item.original_name,
                
                // 优化排版展示
                genreTitle: genreNames || "剧集", 
                subTitle: fullDate ? `⭐ ${score} | ${fullDate}` : `⭐ ${score}`,
                description: fullDate ? `${fullDate} · ⭐ ${score}\n${item.overview || "暂无简介"}` : (item.overview || "暂无简介"),
                
                posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
                backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
                
                // 传给内核的数据
                rating: parseFloat(score) || 0,
                year: year,
                releaseDate: fullDate 
            };
        });

    } catch (e) {
        return [{ id: "err_net", title: "网络错误", description: e.message, type: "text" }];
    }
}
