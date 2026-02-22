/**
 * VOD 直链嗅探引擎 (精简提速版)
 * 核心：保留优秀的竞速机制，移除了超时和失效的冗余节点，仅保留 21 个极速主力源。
 */

// ================= 1. 默认资源站配置 (精简为 21 个高速源) =================
const DEFAULT_SITES = `
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

// ================= 2. 模块元数据定义 =================
WidgetMetadata = {
  id: "vod_stream_a123ggregator_fast",
  title: "万能嗅探引擎 (精简提速版)",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "4.0.0",
  requiredVersion: "0.0.1",
  description: "保留竞速逻辑，剔除死链，内置21个高速主力源，体验秒开。",
  author: "编码助手",
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
      name: "customSites",
      title: "资源站配置 (名称,URL 一行一个)",
      type: "input",
      value: DEFAULT_SITES
    }
  ],
  modules: [
    {
      id: "stream_provider",
      title: "加载流媒体资源",
      functionName: "loadResource",
      type: "stream", 
      params: []
    }
  ]
};

// ================= 3. 辅助解析工具 =================

function parseSites(siteText) {
  const text = siteText || DEFAULT_SITES;
  return text.trim().split('\n').map(line => {
    const [title, url] = line.split(',').map(s => s.trim());
    if (title && url && url.startsWith('http')) {
      return { title, url: (url.endsWith('/') || url.includes('.php') || url.includes('/json')) ? url : url + '/' };
    }
    return null;
  }).filter(Boolean);
}

function extractSeasonInfo(name) {
  if (!name) return { baseName: "", seasonNum: 1 };
  const zhMatch = name.match(/第([一二三四五六七八九十\d]+)[季部]/);
  if (zhMatch) {
    const val = zhMatch[1];
    const sNum = CHINESE_NUM_MAP[val] || parseInt(val) || 1;
    const bName = name.replace(/第[一二三四五六七八九十\d]+[季部]/, '').trim();
    return { baseName: bName, seasonNum: sNum };
  }
  const digitMatch = name.match(/(.+?)(\d+)$/);
  if (digitMatch) {
    return { baseName: digitMatch[1].trim(), seasonNum: parseInt(digitMatch[2]) || 1 };
  }
  return { baseName: name.trim(), seasonNum: 1 };
}

const isM3U8 = (url) => url?.toLowerCase().includes('.m3u8') || false;

// ================= 4. 核心：竞速提取逻辑 =================

async function loadResource(params) {
  const { seriesName, type = 'movie', season, episode, customSites, multiSource } = params;
  
  // 恢复配置开关：如果用户禁用了聚合，直接返回空
  if (multiSource === "disabled" || !seriesName) return [];

  const sites = parseSites(customSites);
  const targetInfo = extractSeasonInfo(seriesName);
  
  const targetSeason = season ? parseInt(season) : targetInfo.seasonNum;
  const targetEpisode = episode ? parseInt(episode) : null;
  const targetBaseName = targetInfo.baseName;

  // 使用 Promise 封装竞速机制
  return new Promise((resolve) => {
    let allResources = [];
    let uniqueUrls = new Set();
    let completedTasks = 0;
    let isResolved = false; // 裁判吹哨标志

    // 裁判检查函数：是否满足返回条件
    const checkAndResolve = () => {
      if (isResolved) return;
      // 只要凑齐 8 个播放源，或者全部执行完了（21个源很快就能跑完），立刻吹哨返回！
      if (allResources.length >= 8 || completedTasks === sites.length) {
        isResolved = true;
        resolve(allResources);
      }
    };

    // 极限硬超时保护：最多等 12 秒。
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        console.log(`[竞速保护] 12秒硬超时，直接返回已拿到的 ${allResources.length} 个资源`);
        resolve(allResources);
      }
    }, 12000);

    // 所有选手（资源站）同时起跑
    sites.forEach(async (site) => {
      try {
        const res = await Widget.http.get(site.url, {
          params: { ac: "detail", wd: targetBaseName, out: "json" },
          timeout: 10000 // 给每个源充足的 10 秒钟去响应
        });
        
        if (isResolved) return; // 比赛结束，后面的选手数据不计入

        let data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        const list = data.list || [];
        if (list.length === 0) return;

        let siteResults = [];

        for (const item of list) {
          const itemInfo = extractSeasonInfo(item.vod_name);
          if (!item.vod_name.includes(targetBaseName)) continue;
          if (type === 'tv' && itemInfo.seasonNum !== targetSeason) continue;

          const playUrls = item.vod_play_url || "";
          const playFroms = (item.vod_play_from || "").split("$$$");
          const playerGroups = playUrls.replace(/#+$/, '').split("$$$");

          playerGroups.forEach((groupUrl, groupIndex) => {
            const sourceName = playFroms[groupIndex] || `线路${groupIndex + 1}`;
            const episodesList = groupUrl.split("#").filter(Boolean);

            episodesList.forEach(epData => {
              const [epTitle, epUrl] = epData.split("$");
              if (!epUrl || !isM3U8(epUrl)) return;

              if (type === 'tv' && targetEpisode !== null) {
                const epNumMatch = epTitle.match(/第?(\d+)集?/);
                const currentEpNum = epNumMatch ? parseInt(epNumMatch[1]) : null;
                if (currentEpNum === targetEpisode || epTitle.includes(`第${targetEpisode}集`) || epTitle === String(targetEpisode)) {
                  siteResults.push({
                    name: `⚡️ ${site.title}`,
                    description: `[${sourceName}] ${epTitle}`,
                    url: epUrl.trim()
                  });
                }
              } else if (type === 'movie') {
                 siteResults.push({
                    name: `⚡️ ${site.title}`,
                    description: `[${sourceName}] ${epTitle}`,
                    url: epUrl.trim()
                  });
              }
            });
          });
        }

        // 选手将拿到的结果放入奖池 (并去重)
        if (siteResults.length > 0 && !isResolved) {
          for (let r of siteResults) {
            if (!uniqueUrls.has(r.url)) {
              uniqueUrls.add(r.url);
              allResources.push(r);
            }
          }
        }
      } catch (err) {
        // 请求失败、超时直接淘汰
      } finally {
        completedTasks++;
        checkAndResolve(); // 跑完向裁判报备
      }
    });
  });
}
