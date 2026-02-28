WidgetMetadata = {
    id: "ultimate_media_hub_pro_ui",
    title: "全球影视 | 分流聚合",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "集大成之作：Trakt/豆瓣/平台分流，全线支持【日期•类型】展示。",
    version: "1.3.4", // 🚀 升级版本号：双模块均适配右上角菜单
    requiredVersion: "0.0.1",
    site: "https://www.themoviedb.org",
    // 1. 全局参数 (仅剩 Trakt ID，且选填)
    globalParams: [
        {
            name: "traktClientId",
            title: "Trakt Client ID",
            type: "input",
            description: "选填，不填则使用内置。Trakt 榜单专用。",
            value: ""
        }
    ],

    modules: [
        {
            title: "🔥 全球热榜聚合",
            functionName: "loadTrendHub",
            type: "video", // 改为 video 以支持更好的海报排版
            cacheDuration: 3600,
            params: [
                {
                    // 👈 修改为 sort_by 触发右上角菜单
                    name: "sort_by",
                    title: "选择榜单",
                    type: "enumeration",
                    value: "trakt_trending",
                    enumOptions: [
                        { title: "🌍 Trakt - 实时热播", value: "trakt_trending" },
                        { title: "🌍 Trakt - 最受欢迎", value: "trakt_popular" },
                        { title: "🌍 Trakt - 最受期待", value: "trakt_anticipated" },
                        { title: "🇨🇳 豆瓣 - 热门国产剧", value: "db_tv_cn" },
                        { title: "🇨🇳 豆瓣 - 热门综艺", value: "db_variety" },
                        { title: "🇨🇳 豆瓣 - 热门电影", value: "db_movie" },
                        { title: "🇺🇸 豆瓣 - 热门美剧", value: "db_tv_us" },
                        { title: "📺 B站 - 番剧热播", value: "bili_bgm" },
                        { title: "📺 B站 - 国创热播", value: "bili_cn" },
                        { title: "🌸 Bangumi - 每日放送", value: "bgm_daily" }
                    ]
                },
                {
                    name: "traktType",
                    title: "Trakt 类型",
                    type: "enumeration",
                    value: "all", 
                    belongTo: { paramName: "sort_by", value: ["trakt_trending", "trakt_popular", "trakt_anticipated"] }, // 👈 同步更新依赖条件
                    enumOptions: [
                        { title: "全部 (剧集+电影)", value: "all" }, 
                        { title: "剧集", value: "shows" },
                        { title: "电影", value: "movies" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        },
        {
            title: "📺 平台分流片库",
            functionName: "loadPlatformMatrix",
            type: "video", // 改为 video 以支持更好的海报排版
            cacheDuration: 3600,
            params: [
                {
                    // 👈 修改为 sort_by 触发右上角菜单，将平台作为主筛选项
                    name: "sort_by",
                    title: "播出平台",
                    type: "enumeration",
                    value: "2007",
                    enumOptions: [
                        { title: "腾讯视频", value: "2007" },
                        { title: "爱奇艺", value: "1330" },
                        { title: "优酷", value: "1419" },
                        { title: "芒果TV", value: "1631" },
                        { title: "Bilibili", value: "1605" },
                        { title: "Netflix", value: "213" },
                        { title: "Disney+", value: "2739" },
                        { title: "HBO", value: "49" },
                        { title: "Apple TV+", value: "2552" }
                    ]
                },
                {
                    name: "category",
                    title: "内容分类",
                    type: "enumeration",
                    value: "tv_drama",
                    enumOptions: [
                        { title: "📺 电视剧", value: "tv_drama" },
                        { title: "🎤 综艺", value: "tv_variety" },
                        { title: "🐲 动漫", value: "tv_anime" },
                        { title: "🎬 电影", value: "movie" } 
                    ]
                },
                {
                    name: "sort",
                    title: "排序",
                    type: "enumeration",
                    value: "popularity.desc",
                    enumOptions: [
                        { title: "🔥 热度最高", value: "popularity.desc" },
                        { title: "📅 最新首播", value: "first_air_date.desc" },
                        { title: "⭐ 评分最高", value: "vote_average.desc" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

// --- 更新：全新的内置 Trakt Client ID ---
const DEFAULT_TRAKT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10762: "儿童", 10763: "新闻",
    10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧", 10767: "脱口秀", 10768: "战争政治"
};

function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ");
}

// --- 适配 Video 横竖版的 buildItem 函数 ---
function buildItem({ id, tmdbId, type, title, date, poster, backdrop, rating, genreText, subTitle, desc }) {
    // 【修复点1】将评分/日期信息和剧情简介拼接在一起，用 \n 换行
    const baseInfo = date ? `${date} · ${subTitle || '⭐ ' + rating}` : (subTitle || `⭐ ${rating}`);
    const overview = desc ? `\n${desc}` : "\n暂无简介";

    return {
        id: String(id),
        tmdbId: parseInt(tmdbId),
        type: "tmdb",
        mediaType: type,
        title: title,
        
        // 横版：只保留流派和类型
        genreTitle: genreText || (type === "tv" ? "剧集" : "电影"), 
        
        // 竖版：展示 评分+日期 \n 剧情简介
        description: baseInfo + overview,
        
        // 传递给内核提取横版年份
        releaseDate: date,
        
        posterPath: poster ? `https://image.tmdb.org/t/p/w500${poster}` : "",
        backdropPath: backdrop ? `https://image.tmdb.org/t/p/w780${backdrop}` : "",
        rating: parseFloat(rating) || 0,
        subTitle: subTitle // 备用保留
    };
}

// =========================================================================
// 1. 业务逻辑
// =========================================================================

async function loadTrendHub(params = {}) {
    // 👈 逻辑接管：从 params.sort_by 中提取榜单源 source
    const source = params.sort_by || "trakt_trending";
    const { traktType = "all" } = params;
    const page = params.page || 1; 
    const traktClientId = params.traktClientId || DEFAULT_TRAKT_ID;

    // --- Trakt (支持混合模式) ---
    if (source.startsWith("trakt_")) {
        const listType = source.replace("trakt_", ""); 
        let rawData = [];

        // 1. 混合模式 (All)
        if (traktType === "all") {
            const [movies, shows] = await Promise.all([
                fetchTraktData("movies", listType, traktClientId, page),
                fetchTraktData("shows", listType, traktClientId, page)
            ]);
            rawData = [...movies, ...shows];
            
            rawData.sort((a, b) => {
                const valA = a.watchers || a.list_count || 0;
                const valB = b.watchers || b.list_count || 0;
                if (valA === 0 && valB === 0) return 0;
                return valB - valA; // 降序
            });
            
        } else {
            // 单一模式
            rawData = await fetchTraktData(traktType, listType, traktClientId, page);
        }
        
        if (!rawData || rawData.length === 0) return page === 1 ? await fetchTmdbFallback(traktType === "all" ? "movie" : traktType) : [];

        // 2. 处理数据
        const promises = rawData.slice(0, 20).map(async (item, index) => {
            let subject = item.show || item.movie || item;
            const mediaType = item.show ? "tv" : "movie";
            
            let rank = (page - 1) * 15 + index + 1;
            let stats = "";
            
            if (listType === "trending") stats = `🔥 ${item.watchers || 0} 人在看`;
            else if (listType === "anticipated") stats = `❤️ ${item.list_count || 0} 人想看`;
            else stats = `No. ${rank}`; // Popular

            if (traktType === "all") {
                stats = `[${mediaType === "tv" ? "剧" : "影"}] ${stats}`;
            }

            if (!subject || !subject.ids || !subject.ids.tmdb) return null;
            return await fetchTmdbDetail(subject.ids.tmdb, mediaType, stats, subject.title);
        });
        return (await Promise.all(promises)).filter(Boolean);
    }

    // --- Douban (保持不变) ---
    if (source.startsWith("db_")) {
        let tag = "热门", type = "tv";
        if (source === "db_tv_cn") { tag = "国产剧"; type = "tv"; }
        else if (source === "db_variety") { tag = "综艺"; type = "tv"; }
        else if (source === "db_movie") { tag = "热门"; type = "movie"; }
        else if (source === "db_tv_us") { tag = "美剧"; type = "tv"; }
        return await fetchDoubanAndMap(tag, type, page);
    }

    // --- Bilibili / Bangumi (保持不变) ---
    if (source.startsWith("bili_")) {
        const type = source === "bili_cn" ? 4 : 1; 
        return await fetchBilibiliRank(type, page);
    }
    if (source === "bgm_daily") {
        if (page > 1) return [];
        return await fetchBangumiDaily();
    }
}

async function loadPlatformMatrix(params = {}) {
    // 👈 逻辑接管：从 params.sort_by 中提取平台 platformId
    const platformId = params.sort_by || "2007";
    const { category = "tv_drama", sort = "popularity.desc" } = params;
    const page = params.page || 1;

    const foreignPlatforms = ["213", "2739", "49", "2552"];
    if (category === "movie" && !foreignPlatforms.includes(platformId)) {
        return page === 1 ? [{ id: "empty", type: "text", title: "暂不支持国内平台电影", description: "请切换为剧集或国外平台" }] : [];
    }

    const queryParams = {
        language: "zh-CN",
        sort_by: sort,
        page: page,
        include_adult: false,
        include_null_first_air_dates: false
    };

    if (category.startsWith("tv_")) {
        queryParams.with_networks = platformId;
        if (category === "tv_anime") queryParams.with_genres = "16";
        else if (category === "tv_variety") queryParams.with_genres = "10764|10767";
        else if (category === "tv_drama") queryParams.without_genres = "16,10764,10767";
        
        return await fetchTmdbDiscover("tv", queryParams);

    } else if (category === "movie") {
        const usMap = { "213":"8", "2739":"337", "49":"1899|15", "2552":"350" };
        queryParams.watch_region = "US";
        queryParams.with_watch_providers = usMap[platformId];
        
        return await fetchTmdbDiscover("movie", queryParams);
    }
}

// =========================================================================
// 2. 数据获取 (Helpers)
// =========================================================================

async function fetchTmdbDiscover(mediaType, params) {
    try {
        const res = await Widget.tmdb.get(`/discover/${mediaType}`, { params });
        const data = res || {};
        if (!data.results || data.results.length === 0) return params.page === 1 ? [{ id: "empty", type: "text", title: "暂无数据" }] : [];
        
        return data.results.map(item => {
            const date = item.first_air_date || item.release_date || "";
            const genreText = getGenreText(item.genre_ids);
            
            return buildItem({
                id: item.id,
                tmdbId: item.id,
                type: mediaType,
                title: item.name || item.title,
                date: date,
                poster: item.poster_path,
                backdrop: item.backdrop_path,
                rating: item.vote_average?.toFixed(1) || "0.0",
                genreText: genreText,
                subTitle: `⭐ ${item.vote_average?.toFixed(1)}`,
                desc: item.overview // 这里正常传入了简介
            });
        });
    } catch (e) { return [{ id: "err", type: "text", title: "加载失败" }]; }
}

async function fetchTmdbDetail(id, type, stats, title) {
    try {
        const d = await Widget.tmdb.get(`/${type}/${id}`, { params: { language: "zh-CN" } });
        const date = d.first_air_date || d.release_date || "";
        const genreText = (d.genres || []).map(g => g.name).slice(0, 3).join(" / ");
        
        return buildItem({
            id: d.id,
            tmdbId: d.id,
            type: type,
            title: d.name || d.title || title,
            date: date,
            poster: d.poster_path,
            backdrop: d.backdrop_path,
            rating: d.vote_average?.toFixed(1),
            genreText: genreText,
            subTitle: stats,
            desc: d.overview // 这里正常传入了简介
        });
    } catch (e) { return null; }
}

async function searchTmdb(query, type) {
    const q = query.replace(/第[一二三四五六七八九十\d]+[季章]/g, "").trim();
    try {
        const res = await Widget.tmdb.get(`/search/${type}`, { 
            params: { query: encodeURIComponent(q), language: "zh-CN" } 
        });
        return (res.results || [])[0];
    } catch (e) { return null; }
}

// --- 更新：支持混合平台数据的排版融合 ---
function mergeTmdb(target, source) {
    target.id = String(source.id);
    target.tmdbId = source.id;
    target.posterPath = source.poster_path ? `https://image.tmdb.org/t/p/w500${source.poster_path}` : target.posterPath;
    target.backdropPath = source.backdrop_path ? `https://image.tmdb.org/t/p/w780${source.backdrop_path}` : "";
    
    const date = source.first_air_date || source.release_date || "";
    const genreText = getGenreText(source.genre_ids);
    
    target.genreTitle = genreText || (target.mediaType === "tv" ? "剧集" : "电影");
    target.releaseDate = date;
    
    // 【修复点2】合并数据时，也要把 TMDB 查到的 overview 剧情拼接到末尾
    const baseInfo = date ? `${date} · ${target.subTitle}` : target.subTitle;
    const overview = source.overview ? `\n${source.overview}` : "\n暂无简介";
    target.description = baseInfo + overview;
    
    target.rating = source.vote_average ? parseFloat(source.vote_average) : 0;
}

// =========================================================================
// 第三方源
// =========================================================================

async function fetchTraktData(type, list, id, page) {
    try {
        const res = await Widget.http.get(`https://api.trakt.tv/${type}/${list}?limit=15&page=${page}`, {
            headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": id }
        });
        return res.data || [];
    } catch (e) { return []; }
}

async function fetchDoubanAndMap(tag, type, page) {
    const start = (page - 1) * 20;
    try {
        const res = await Widget.http.get(`https://movie.douban.com/j/search_subjects?type=${type}&tag=${encodeURIComponent(tag)}&sort=recommend&page_limit=20&page_start=${start}`, {
            headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" }
        });
        const list = (res.data || {}).subjects || [];
        if (list.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无数据" }] : [];
        
        const promises = list.map(async (item, i) => {
            // 【修复点3】兜底 description，防止没搜到 TMDB 数据时没有简介占位
            let finalItem = { 
                id: `db_${item.id}`, type: "tmdb", mediaType: type, 
                title: item.title, 
                subTitle: `豆瓣🫛 ${item.rate}`, 
                description: `豆瓣 ${item.rate}\n暂无简介`, // 预设的占位格式
                genreTitle: type === "tv" ? "剧集" : "电影",
                posterPath: item.cover 
            };
            const tmdb = await searchTmdb(item.title, type);
            if (tmdb) mergeTmdb(finalItem, tmdb); 
            return finalItem;
        });
        return await Promise.all(promises);
    } catch (e) { return [{ id: "err", type: "text", title: "豆瓣连接失败" }]; }
}

async function fetchBilibiliRank(type, page) {
    try {
        const res = await Widget.http.get(`https://api.bilibili.com/pgc/web/rank/list?day=3&season_type=${type}`);
        const allList = (res.data?.result?.list || res.data?.data?.list || []);
        
        const pageSize = 15;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        if (start >= allList.length) return [];
        const list = allList.slice(start, end);
        
        const promises = list.map(async (item, i) => {
            const rank = start + i + 1;
            // 【修复点3】兜底 description
            let finalItem = { 
                id: `bili_${rank}`, type: "tmdb", mediaType: "tv", 
                title: item.title, 
                subTitle: item.new_ep?.index_show || "热播中", 
                description: `${item.new_ep?.index_show || "热播中"}\n暂无简介`, // 预设的占位格式
                genreTitle: "剧集",
                posterPath: item.cover 
            };
            const tmdb = await searchTmdb(item.title, "tv");
            if (tmdb) mergeTmdb(finalItem, tmdb);
            return finalItem;
        });
        return await Promise.all(promises);
    } catch (e) { return [{ id: "err", type: "text", title: "B站连接失败" }]; }
}

async function fetchBangumiDaily() {
    try {
        const res = await Widget.http.get("https://api.bgm.tv/calendar");
        const data = res.data || [];
        const dayId = (new Date().getDay() || 7);
        const items = data.find(d => d.weekday.id === dayId)?.items || [];
        
        const promises = items.map(async item => {
            const name = item.name_cn || item.name;
            // 【修复点3】兜底 description
            let finalItem = { 
                id: `bgm_${item.id}`, type: "tmdb", mediaType: "tv", 
                title: name, 
                subTitle: item.name, 
                description: `${item.name}\n暂无简介`, // 预设的占位格式
                genreTitle: "剧集",
                posterPath: item.images?.large 
            };
            const tmdb = await searchTmdb(name, "tv");
            if (tmdb) mergeTmdb(finalItem, tmdb);
            return finalItem;
        });
        return await Promise.all(promises);
    } catch (e) { return []; }
}

async function fetchTmdbFallback(traktType) {
    const type = traktType === "shows" ? "tv" : "movie";
    try {
        const r = await Widget.tmdb.get(`/trending/${type}/day`, { params: { language: "zh-CN" } });
        return (r.results || []).slice(0, 15).map(item => {
            const date = item.first_air_date || item.release_date || "";
            const genreText = getGenreText(item.genre_ids);
            return buildItem({
                id: item.id, tmdbId: item.id, type: type,
                title: item.name || item.title,
                date: date,
                genreText: genreText,
                poster: item.poster_path,
                subTitle: "TMDB Trending",
                rating: item.vote_average?.toFixed(1),
                desc: item.overview // 【修复点4】将简介字段补上
            });
        });
    } catch(e) { return []; }
}
