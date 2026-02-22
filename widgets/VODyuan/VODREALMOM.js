// --- 21个精选极速主力源 ---
const RESOURCE_SITES = `
非凡资源,http://ffzy5.tv/api.php/provide/vod/
卧龙资源,https://wolongzyw.com/api.php/provide/vod/
最大资源,https://api.zuidapi.com/api.php/provide/vod/
暴风资源,https://bfzyapi.com/api.php/provide/vod/
极速资源,https://jszyapi.com/api.php/provide/vod/
无尽资源,https://api.wujinapi.com/api.php/provide/vod/
电影天堂,http://caiji.dyttzyapi.com/api.php/provide/vod/
如意资源,https://cj.rycjapi.com/api.php/provide/vod/
红牛资源,https://www.hongniuzy2.com/api.php/provide/vod/
光速资源,https://api.guangsuapi.com/api.php/provide/vod/
IKUN资源,https://ikunzyapi.com/api.php/provide/vod/
优酷资源,https://api.ukuapi.com/api.php/provide/vod/
虎牙资源,https://www.huyaapi.com/api.php/provide/vod/
新浪资源,http://api.xinlangapi.com/xinlangapi.php/provide/vod/
乐子资源,https://cj.lziapi.com/api.php/provide/vod/
鲸鱼资源,https://jyzyapi.com/provide/vod/
爱蛋资源,https://lovedan.net/api.php/provide/vod/
茅台资源,https://caiji.maotaizy.cc/api.php/provide/vod/
豆瓣资源,https://dbzy.tv/api.php/provide/vod/
速博资源,https://subocaiji.com/api.php/provide/vod/
飘零资源,https://p2100.net/api.php/provide/vod/
`;

const CHINESE_NUM_MAP = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
};

WidgetMetadata = {
  id: "vod_realmom",
  title: "VOD 播放源",
  icon: "https://raw.githubusercontent.com/MakkaPakka518/FW/refs/heads/main/widgets/tubiao/makka.png",
  version: "1.0.3",
  requiredVersion: "0.0.1",
  description: "获取VOD播放资源(内含21个VOD源)",
  author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
  site: "https://github.com/MakkaPakka518/FW",
  globalParams: [
    {
      name: "multiSource",
      title: "是否启用聚合搜索",
      type: "enumeration",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "禁用", value: "disabled" }
      ]
    },
    {
      name: "VodData",
      title: "CSV格式的源配置",
      type: "input",
      value: RESOURCE_SITES
    }
  ],
  modules: [
    {
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    }
  ],
};

// --- 辅助工具函数 ---

const isM3U8Url = (url) => url?.toLowerCase().includes('m3u8') || false;

function extractSeasonInfo(seriesName) {
  if (!seriesName) return { baseName: seriesName, seasonNumber: 1 };
  const chineseMatch = seriesName.match(/第([一二三四五六七八九十\d]+)[季部]/);
  if (chineseMatch) {
    const val = chineseMatch[1];
    const seasonNum = CHINESE_NUM_MAP[val] || parseInt(val) || 1;
    const baseName = seriesName.replace(/第[一二三四五六七八九十\d]+[季部]/, '').trim();
    return { baseName, seasonNumber: seasonNum };
  }
  const digitMatch = seriesName.match(/(.+?)(\d+)$/);
  if (digitMatch) {
    return { baseName: digitMatch[1].trim(), seasonNumber: parseInt(digitMatch[2]) || 1 };
  }
  return { baseName: seriesName.trim(), seasonNumber: 1 };
}

/**
 * 修改后的提取逻辑：不再直接过滤集数，而是返回带标记的所有集数以便缓存
 */
function extractPlayInfoForCache(item, siteTitle, type) {
  const { vod_name, vod_play_url, vod_play_from, vod_remarks = '' } = item;
  if (!vod_name || !vod_play_url) return [];

  const playSources = vod_play_url.replace(/#+$/, '').split('$$$');
  const sourceNames = (vod_play_from || '').split('$$$');
  
  return playSources.flatMap((playSource, i) => {
    const sourceName = sourceNames[i] || '默认源';
    const isTV = playSource.includes('#');
    const results = [];

    if (type === 'tv' && isTV) {
      const episodes = playSource.split('#').filter(Boolean);
      episodes.forEach(ep => {
        const [epName, url] = ep.split('$');
        if (url && isM3U8Url(url)) {
          // 提取数字集数用于后续精确过滤
          const epMatch = epName.match(/第(\d+)集/);
          results.push({
            name: siteTitle,
            description: `${vod_name} - ${epName}${vod_remarks ? ' - ' + vod_remarks : ''} - [${sourceName}]`,
            url: url.trim(),
            _ep: epMatch ? parseInt(epMatch[1]) : null // 内部标记
          });
        }
      });
    } else if (type === 'movie' && !isTV) {
      const firstM3U8 = playSource.split('#').find(v => isM3U8Url(v.split('$')[1]));
      if (firstM3U8) {
        const [quality, url] = firstM3U8.split('$');
        const qualityText = quality.toLowerCase().includes('tc') ? '抢先版' : '正片';
        results.push({
          name: siteTitle,
          description: `${vod_name} - ${qualityText} - [${sourceName}]`,
          url: url.trim()
        });
      }
    }
    return results;
  });
}

function parseResourceSites(VodData) {
  const parseLine = (line) => {
    const [title, value] = line.split(',').map(s => s.trim());
    // 稍微优化：防止像 .php 结尾的接口被强制加上 '/'
    if (title && value?.startsWith('http')) {
      return { title, value: (value.endsWith('/') || value.includes('.php') || value.includes('/json')) ? value : value + '/' };
    }
    return null;
  };
  try {
    const trimmed = VodData?.trim() || "";
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return JSON.parse(trimmed).map(s => ({ title: s.title || s.name, value: s.url || s.value })).filter(s => s.title && s.value);
    }
    return trimmed.split('\n').map(parseLine).filter(Boolean);
  } catch (e) {
    return RESOURCE_SITES.trim().split('\n').map(parseLine).filter(Boolean);
  }
}

// --- 主入口函数 ---

async function loadResource(params) {
  const { seriesName, type = 'tv', season, episode, multiSource, VodData } = params;
  if (multiSource !== "enabled" || !seriesName) return [];

  const resourceSites = parseResourceSites(VodData);
  const { baseName, seasonNumber } = extractSeasonInfo(seriesName);
  const targetSeason = season ? parseInt(season) : seasonNumber;
  const targetEpisode = episode ? parseInt(episode) : null;

  // 1. 尝试从缓存获取
  const cacheKey = `vod_exact_cache_${baseName}_s${targetSeason}_${type}`;
  let allResources = [];
  
  try {
    const cached = Widget.storage.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      console.log(`命中缓存: ${cacheKey}`);
      allResources = cached;
    }
  } catch (e) {}

  // 2. 如果没有缓存，则发起网络请求
  if (allResources.length === 0) {
    const fetchTasks = resourceSites.map(async (site) => {
      try {
        const response = await Widget.http.get(site.value, {
          params: { ac: "detail", wd: baseName.trim() },
          timeout: 10000 
        });
        const list = response?.data?.list;
        if (!Array.isArray(list)) return [];

        return list.flatMap(item => {
          const itemInfo = extractSeasonInfo(item.vod_name);
          
          // 精确匹配逻辑
          if (itemInfo.baseName !== baseName || itemInfo.seasonNumber !== targetSeason) {
            return [];
          }
          
          return extractPlayInfoForCache(item, site.title, type);
        });
      } catch (error) {
        return [];
      }
    });

    const results = await Promise.all(fetchTasks);
    const merged = results.flat();

    // URL 去重
    const urlSet = new Set();
    allResources = merged.filter(res => {
      if (urlSet.has(res.url)) return false;
      urlSet.add(res.url);
      return true;
    });

    // 写入缓存（有效期3小时 = 10800秒）
    if (allResources.length > 0) {
      try { Widget.storage.set(cacheKey, allResources, 10800); } catch (e) {}
    }
  }

  // 3. 结果返回：根据 targetEpisode 进行最后的精确过滤
  if (type === 'tv' && targetEpisode !== null) {
    return allResources.filter(res => {
      // 优先根据提取时的 _ep 数字匹配，若无则根据描述文字匹配
      if (res._ep !== undefined && res._ep !== null) {
        return res._ep === targetEpisode;
      }
      return res.description.includes(`第${targetEpisode}集`);
    });
  }

  return allResources;
}
