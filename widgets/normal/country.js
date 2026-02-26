// 1. 核心字典定义
const REGION_MAP = {
    "全球": "", "大陆": "CN", "香港": "HK", "台湾": "TW", "港台": "HK|TW",
    "日本": "JP", "韩国": "KR", "日韩": "JP|KR", "泰国": "TH", "新加坡": "SG",
    "马来西亚": "MY", "印度": "IN", "亚太": "CN|HK|TW|JP|KR|TH|SG|MY|IN|ID|PH|VN",
    "美国": "US", "英国": "GB", "德国": "DE", "瑞典": "SE",
    "欧洲": "GB|DE|SE|FR|IT|ES|NL|BE|DK|NO|FI|PL|RU",
    "西班牙": "ES", "墨西哥": "MX", "西语拉丁": "ES|MX|AR|CO|CL|PE|VE|UY"
};

const SORT_MAP = {
    "热门": "popularity.desc",
    "评分": "vote_average.desc",
    "时间": "primary_release_date.desc" // 剧集在请求时会动态替换
};

const GENRE_MAP = {
    "全部": "", "科幻": "878", "悬疑": "9648", "恐怖": "27",
    "动作": "28", "喜剧": "35", "爱情": "10749", "动画": "16", "犯罪": "80"
};

// 生成下拉选项的辅助函数
const generateOptions = (map) => Object.keys(map).map(key => ({ title: key, value: key }));

// 2. Widget 元数据定义 (必须在最外层)
WidgetMetadata = {
    id: "country_tmdb_discovery",
    title: "🏆 全球影视分类",
    description: "多维度多国家影视榜单，按热门、评分、时间自由探索",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.0.0",
    requiredVersion: "0.0.3", // 当前要求的最低内核版本
    modules: [
        {
            title: "🎬 电影榜单",
            functionName: "loadMovies",
            type: "video", // 默认模块类型
            cacheDuration: 3600,
            params: [
                {
                    name: "genre",
                    title: "类型",
                    type: "enumeration",
                    value: "全部",
                    enumOptions: generateOptions(GENRE_MAP)
                },
                {
                    name: "country",
                    title: "国家/地区",
                    type: "enumeration",
                    value: "全球",
                    enumOptions: generateOptions(REGION_MAP)
                },
                {
                    name: "sort",
                    title: "排序",
                    type: "enumeration",
                    value: "热门",
                    enumOptions: generateOptions(SORT_MAP)
                },
                { name: "page", title: "页码", type: "page", startPage: 1 } // 自动递增翻页
            ]
        },
        {
            title: "📺 剧集榜单",
            functionName: "loadSeries",
            type: "video",
            cacheDuration: 3600,
            params: [
                {
                    name: "genre",
                    title: "类型",
                    type: "enumeration",
                    value: "全部",
                    enumOptions: generateOptions(GENRE_MAP)
                },
                {
                    name: "country",
                    title: "国家/地区",
                    type: "enumeration",
                    value: "全球",
                    enumOptions: generateOptions(REGION_MAP)
                },
                {
                    name: "sort",
                    title: "排序",
                    type: "enumeration",
                    value: "热门",
                    enumOptions: generateOptions(SORT_MAP)
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// 3. 处理函数实现

/**
 * 加载电影榜单
 */
async function loadMovies(params = {}) {
    try {
        const { genre = "全部", country = "全球", sort = "热门", page = 1 } = params;
        
        const tmdbParams = {
            language: "zh-CN",
            page: page,
            sort_by: SORT_MAP[sort],
            "vote_count.gte": 10 // 确保冷门烂片不会排在前面
        };

        if (GENRE_MAP[genre]) tmdbParams.with_genres = GENRE_MAP[genre];
        if (REGION_MAP[country]) tmdbParams.with_origin_country = REGION_MAP[country];

        // 使用内置的 Widget.tmdb 发起请求，免鉴权！
        const response = await Widget.tmdb.get("discover/movie", { params: tmdbParams });
        const results = response.data.results || [];

        return results.map(item => ({
            id: `movie.${item.id}`, // 特殊 ID 格式，内核会自动解析
            type: "tmdb", // 告诉内核这是 TMDB 资源
            title: item.title,
            description: item.overview,
            coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
            backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : "",
            releaseDate: item.release_date,
            mediaType: "movie",
            rating: item.vote_average
        }));

    } catch (error) {
        console.error("加载电影榜单失败:", error);
        throw error;
    }
}

/**
 * 加载剧集榜单
 */
async function loadSeries(params = {}) {
    try {
        const { genre = "全部", country = "全球", sort = "热门", page = 1 } = params;
        
        let sortBy = SORT_MAP[sort];
        if (sort === "时间") sortBy = "first_air_date.desc"; // 剧集的首播时间字段名不一样

        const tmdbParams = {
            language: "zh-CN",
            page: page,
            sort_by: sortBy,
            "vote_count.gte": 10 
        };

        if (GENRE_MAP[genre]) tmdbParams.with_genres = GENRE_MAP[genre];
        if (REGION_MAP[country]) tmdbParams.with_origin_country = REGION_MAP[country];

        const response = await Widget.tmdb.get("discover/tv", { params: tmdbParams });
        const results = response.data.results || [];

        return results.map(item => ({
            id: `tv.${item.id}`, // 剧集的 ID 格式为 tv.xxxxx
            type: "tmdb",
            title: item.name,
            description: item.overview,
            coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
            backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : "",
            releaseDate: item.first_air_date,
            mediaType: "tv",
            rating: item.vote_average
        }));

    } catch (error) {
        console.error("加载剧集榜单失败:", error);
        throw error;
    }
}
