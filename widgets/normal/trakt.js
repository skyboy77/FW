WidgetMetadata = {
    id: "trakt_personal_mixed",
    title: "Trak 追剧日历&个人中心",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "追剧日历:显示你观看剧集最新集的 更新时间&Trakt 待看/收藏/历史。",
    version: "1.1.9", // 🚀 强迫症终极版：将类型精准填入 genreTitle，完美对接横版的类型拼接点
    requiredVersion: "0.0.1",
    site: "https://trakt.tv",

    globalParams: [
        { name: "traktUser", title: "Trakt 用户名 (必填)", type: "input", value: "" },
        { name: "traktClientId", title: "Trakt Client ID (选填，不填使用内置)", type: "input", value: "" }
    ],

    modules: [
        {
            title: "我的片单",
            functionName: "loadTraktProfile",
            type: "list",
            cacheDuration: 300,
            params: [
                {
                    name: "section",
                    title: "浏览区域",
                    type: "enumeration",
                    value: "updates",
                    enumOptions: [
                        { title: "📅 追剧日历", value: "updates" },
                        { title: "📜 待看列表", value: "watchlist" },
                        { title: "📦 收藏列表", value: "collection" }, 
                        { title: "🕒 观看历史", value: "history" }
                    ]
                },
                {
                    name: "type",
                    title: "内容筛选",
                    type: "enumeration",
                    value: "all",
                    belongTo: { paramName: "section", value: ["watchlist", "collection", "history"] },
                    enumOptions: [ { title: "全部", value: "all" }, { title: "剧集", value: "shows" }, { title: "电影", value: "movies" } ]
                },
                {
                    name: "updateSort",
                    title: "追剧模式",
                    type: "enumeration",
                    value: "future_first",
                    belongTo: { paramName: "section", value: ["updates"] },
                    enumOptions: [
                        { title: "🔜 从今天往后", value: "future_first" },
                        { title: "🔄 按更新倒序", value: "air_date_desc" },
                        { title: "👁️ 按观看倒序", value: "watched_at" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

// ==========================================
// 0. 全局配置与工具函数
// ==========================================

const DEFAULT_CLIENT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482"; 

// ==========================================
// 1. 主逻辑
// ==========================================

async function loadTraktProfile(params = {}) {
    const { traktUser, traktClientId, section, updateSort = "future_first", type = "all", page = 1 } = params;

    if (!traktUser) {
        return [{ id: "err", type: "text", title: "请填写 Trakt 用户名" }];
    }
    
    const finalClientId = traktClientId || DEFAULT_CLIENT_ID;

    // === A. 追剧日历 (Updates) ===
    if (section === "updates") {
        return await loadUpdatesLogic(traktUser, finalClientId, updateSort, page);
    }

    // === B. 常规列表 ===
    let rawItems = [];
    const sortType = "added,desc"; 
    
    if (type === "all") {
        const [movies, shows] = await Promise.all([
            fetchTraktList(section, "movies", sortType, page, traktUser, finalClientId),
            fetchTraktList(section, "shows", sortType, page, traktUser, finalClientId)
        ]);
        rawItems = [...movies, ...shows];
    } else {
        rawItems = await fetchTraktList(section, type, sortType, page, traktUser, finalClientId);
    }
    
    rawItems.sort((a, b) => new Date(getItemTime(b, section)) - new Date(getItemTime(a, section)));
    
    if (!rawItems || rawItems.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "列表为空" }] : [];

    const promises = rawItems.map(async (item) => {
        const subject = item.show || item.movie || item;
        if (!subject?.ids?.tmdb) return null;
        let subInfo = "";
        const timeStr = getItemTime(item, section);
        if (timeStr) subInfo = timeStr.split('T')[0];
        if (type === "all") subInfo = `[${item.show ? "剧" : "影"}] ${subInfo}`;
        return await fetchTmdbDetail(subject.ids.tmdb, item.show ? "tv" : "movie", subInfo, subject.title);
    });
    return (await Promise.all(promises)).filter(Boolean);
}

// ==========================================
// 2. 追剧日历逻辑
// ==========================================

async function loadUpdatesLogic(user, clientId, sort, page) {
    const url = `https://api.trakt.tv/users/${user}/watched/shows?extended=noseasons&limit=100`;
    try {
        const res = await Widget.http.get(url, {
            headers: { 
                "Content-Type": "application/json", 
                "trakt-api-version": "2", 
                "trakt-api-key": clientId
            }
        });
        const data = res.data || [];
        if (data.length === 0) return [{ id: "empty", type: "text", title: "无观看记录" }];

        const enrichedShows = await Promise.all(data.slice(0, 60).map(async (item) => {
            if (!item.show?.ids?.tmdb) return null;
            const tmdb = await fetchTmdbShowDetails(item.show.ids.tmdb);
            if (!tmdb) return null;
            
            const nextAir = tmdb.next_episode_to_air?.air_date;
            const lastAir = tmdb.last_episode_to_air?.air_date;
            const sortDate = nextAir || lastAir || "1970-01-01";
            const today = new Date().toISOString().split('T')[0];
            const isFuture = sortDate >= today;

            return {
                trakt: item, tmdb: tmdb,
                sortDate: sortDate,
                isFuture: isFuture,
                watchedDate: item.last_watched_at
            };
        }));

        const valid = enrichedShows.filter(Boolean);
        
        if (sort === "future_first") {
            const futureShows = valid.filter(s => s.isFuture && s.tmdb.next_episode_to_air);
            const pastShows = valid.filter(s => !s.isFuture || !s.tmdb.next_episode_to_air);
            futureShows.sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));
            pastShows.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
            valid.length = 0; 
            valid.push(...futureShows, ...pastShows);
        } else if (sort === "air_date_desc") {
            valid.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
        } else {
            valid.sort((a, b) => new Date(b.watchedDate) - new Date(a.watchedDate));
        }

        const start = (page - 1) * 15;
        return valid.slice(start, start + 15).map(item => {
            const d = item.tmdb;
            let displayStr = "暂无排期";
            let yearStr = "";
            let epData = d.next_episode_to_air || d.last_episode_to_air;
            
            let genreStr = d.genres && d.genres.length > 0 ? d.genres[0].name : "剧集";

            if (epData) {
                const airDate = epData.air_date; 
                yearStr = airDate.substring(0, 4); 
                
                const month = parseInt(airDate.substring(5, 7), 10);
                const day = parseInt(airDate.substring(8, 10), 10);
                
                const s = epData.season_number;
                const e = epData.episode_number;
                
                displayStr = `${yearStr}/S${s}•E${e}/${month}.${day}`;
            }

            return {
                id: String(d.id), 
                tmdbId: d.id, 
                type: "tmdb", 
                mediaType: "tv", 
                title: d.name, 
                // 👇 把类型填入 genreTitle，完美对接横版的系统拼接！
                genreTitle: genreStr, 
                // 👇 subTitle 置空，防止系统又搞出什么幺蛾子拼接
                subTitle: "", 
                releaseDate: displayStr, 
                year: yearStr, 
                posterPath: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : "",
                description: `上次观看: ${item.watchedDate.split("T")[0]}\n${d.overview}`
            };
        });
    } catch (e) { return []; }
}

// ==========================================
// 3. 通用列表获取逻辑
// ==========================================

async function fetchTraktList(section, type, sort, page, user, clientId) {
    const limit = 20; 
    let url = "";

    if (section === "collection") {
        url = `https://api.trakt.tv/users/${user}/favorites/${type}?extended=full&page=${page}&limit=${limit}`;
    } else {
        url = `https://api.trakt.tv/users/${user}/${section}/${type}?extended=full&page=${page}&limit=${limit}`;
    }

    try {
        const res = await Widget.http.get(url, {
            headers: { 
                "Content-Type": "application/json", 
                "trakt-api-version": "2", 
                "trakt-api-key": clientId
            }
        });
        return Array.isArray(res.data) ? res.data : [];
    } catch (e) { return []; }
}

function getItemTime(item, section) {
    if (section === "watchlist") return item.listed_at;
    if (section === "history") return item.watched_at;
    if (section === "collection") return item.listed_at; 
    return item.created_at || "1970-01-01";
}

async function fetchTmdbDetail(id, type, subInfo, originalTitle) {
    try {
        const d = await Widget.tmdb.get(`/${type}/${id}`, { params: { language: "zh-CN" } });
        
        const fullDate = d.first_air_date || d.release_date || "";
        const year = fullDate.substring(0, 4); 
        const genre = d.genres && d.genres.length > 0 ? d.genres[0].name : "影视";

        return {
            id: String(d.id), tmdbId: d.id, type: "tmdb", mediaType: type,
            title: d.name || d.title || originalTitle,
            // 👇 这里也同步修正，确保常规列表横版表现也一致
            genreTitle: genre, 
            subTitle: "",
            releaseDate: fullDate,       
            year: year, 
            description: `记录时间: ${subInfo}\n${d.overview || "暂无简介"}`, 
            posterPath: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : ""
        };
    } catch (e) { return null; }
}

async function fetchTmdbShowDetails(id) {
    try { return await Widget.tmdb.get(`/tv/${id}`, { params: { language: "zh-CN" } }); } catch (e) { return null; }
}
