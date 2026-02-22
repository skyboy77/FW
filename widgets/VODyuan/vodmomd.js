/**
 * VOD 直链嗅探引擎 (完美平衡版)
 * 修复: 延长 CMS 接口请求时间至 10 秒，加入 12 秒硬超时，搜集满 8 个线路立刻返回。
 * 恢复: multiSource 启用/禁用开关。
 */

// ================= 1. 默认资源站配置 (完整 56 个普通源) =================
const DEFAULT_SITES = `
非凡资源,http://ffzy5.tv/api.php/provide/vod/
卧龙资源,https://wolongzyw.com/api.php/provide/vod/
最大资源,https://api.zuidapi.com/api.php/provide/vod/
百度云资源,https://api.apibdzy.com/api.php/provide/vod/
暴风资源,https://bfzyapi.com/api.php/provide/vod/
极速资源,https://jszyapi.com/api.php/provide/vod/
天涯资源,https://tyyszy.com/api.php/provide/vod/
无尽资源,https://api.wujinapi.com/api.php/provide/vod/
魔都资源,https://www.mdzyapi.com/api.php/provide/vod/
360资源,https://360zy.com/api.php/provide/vod/
电影天堂,http://caiji.dyttzyapi.com/api.php/provide/vod/
如意资源,https://cj.rycjapi.com/api.php/provide/vod/
旺旺资源,https://wwzy.tv/api.php/provide/vod/
红牛资源,https://www.hongniuzy2.com/api.php/provide/vod/
光速资源,https://api.guangsuapi.com/api.php/provide/vod/
iKun资源,https://ikunzyapi.com/api.php/provide/vod/
优酷资源,https://api.ukuapi.com/api.php/provide/vod/
虎牙资源,https://www.huyaapi.com/api.php/provide/vod/
新浪资源,http://api.xinlangapi.com/xinlangapi.php/provide/vod/
乐子资源,https://cj.lziapi.com/api.php/provide/vod/
海豚资源,https://hhzyapi.com/api.php/provide/vod/
鲸鱼资源,https://jyzyapi.com/provide/vod/
爱蛋资源,https://lovedan.net/api.php/provide/vod/
魔都影视,https://www.moduzy.com/api.php/provide/vod/
非凡API,https://api.ffzyapi.com/api.php/provide/vod/
非凡采集,http://cj.ffzyapi.com/api.php/provide/vod/
非凡采集HTTPS,https://cj.ffzyapi.com/api.php/provide/vod/
非凡线路1,http://ffzy1.tv/api.php/provide/vod/
卧龙采集,https://collect.wolongzyw.com/api.php/provide/vod/
暴风APP,https://app.bfzyapi.com/api.php/provide/vod/
无尽ME,https://api.wujinapi.me/api.php/provide/vod/
天涯海角,https://tyyszyapi.com/api.php/provide/vod/
光速HTTP,http://api.guangsuapi.com/api.php/provide/vod/
新浪HTTPS,https://api.xinlangapi.com/xinlangapi.php/provide/vod/
1080JSON,https://api.1080zyku.com/inc/apijson.php
乐子HTTP,http://cj.lziapi.com/api.php/provide/vod/
U酷资源88,https://api.ukuapi88.com/api.php/provide/vod/
无尽CC,https://api.wujinapi.cc/api.php/provide/vod/
丫丫点播,https://cj.yayazy.net/api.php/provide/vod/
卧龙CC,https://collect.wolongzy.cc/api.php/provide/vod/
无尽NET,https://api.wujinapi.net/api.php/provide/vod/
旺旺API,https://api.wwzy.tv/api.php/provide/vod/
最大点播,http://zuidazy.me/api.php/provide/vod/
樱花资源,https://m3u8.apiyhzy.com/api.php/provide/vod/
步步高资源,https://api.yparse.com/api/json
牛牛点播,https://api.niuniuzy.me/api.php/provide/vod/
索尼资源,https://suoniapi.com/api.php/provide/vod/
茅台资源,https://caiji.maotaizy.cc/api.php/provide/vod/
豆瓣资源,https://dbzy.tv/api.php/provide/vod/
速博资源,https://subocaiji.com/api.php/provide/vod/
金鹰点播,https://jinyingzy.com/api.php/provide/vod/
閃電资源,https://sdzyapi.com/api.php/provide/vod/
飘零资源,https://p2100.net/api.php/provide/vod/
魔都动漫,https://caiji.moduapi.cc/api.php/provide/vod/
红牛资源3,https://www.hongniuzy3.com/api.php/provide/vod/
索尼-闪电,https://xsd.sdzyapi.com/api.php/provide/vod/
`;

const CHINESE_NUM_MAP = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
};

// ================= 2. 模块元数据定义 =================
WidgetMetadata = {
  id: "vod_stream_ag11gregator_balanced",
  title: "万能嗅探引擎 (平衡版)",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "3.1.0",
  requiredVersion: "0.0.1",
  description: "采用智能抢答机制，兼容慢速源，最长等待12秒或凑齐8个源秒出。",
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
      // 策略调整：只要凑齐 8 个播放源，或者全部源都执行完了，立刻吹哨返回！
      if (allResources.length >= 8 || completedTasks === sites.length) {
        isResolved = true;
        resolve(allResources);
      }
    };

    // 极限硬超时保护：最多等 12 秒。时间一到，手上有几个就算几个，立刻返回！
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        console.log(`[竞速保护] 12秒硬超时，直接返回已拿到的 ${allResources.length} 个资源`);
        resolve(allResources);
      }
    }, 12000);

    // 56 名选手（资源站）同时起跑
    sites.forEach(async (site) => {
      try {
        const res = await Widget.http.get(site.url, {
          params: { ac: "detail", wd: targetBaseName, out: "json" },
          timeout: 10000 // 给每个源充足的 10 秒钟去响应
        });
        
        if (isResolved) return; // 如果比赛已经结束，选手跑到终点也不计入了

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
        // 请求失败、超时直接淘汰静默
      } finally {
        completedTasks++;
        checkAndResolve(); // 每位选手跑完都去向裁判报备
      }
    });
  });
}
