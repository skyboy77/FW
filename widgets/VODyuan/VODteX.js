/**
 * VOD 直链嗅探引擎 (Stream Provider) - 满血版 56源
 * 工作原理: 当用户在外部榜单(如 TMDB)点击影片时，FW 自动传入 seriesName/season/episode 等参数
 * 本模块并发搜索配置的资源站，精准提取 m3u8 直链返回给播放器。
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
  id: "vod_stream_aggregator",
  title: "万能资源聚合嗅探",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "2.1.0",
  requiredVersion: "0.0.1",
  description: "内置56个接口，为应用提供底层的 m3u8 直链聚合搜索支持",
  author: "编码助手",
  // 全局参数，用户可以在插件设置中自定义源
  globalParams: [
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
      type: "stream", // 关键标识：告诉 FW 这是一个后台直链提供者
      params: []
    }
  ]
};

// ================= 3. 辅助解析工具 =================

// 解析配置的网站列表
function parseSites(siteText) {
  const text = siteText || DEFAULT_SITES;
  return text.trim().split('\n').map(line => {
    const [title, url] = line.split(',').map(s => s.trim());
    if (title && url && url.startsWith('http')) {
      return { title, url: url.endsWith('/') ? url : url + '/' };
    }
    return null;
  }).filter(Boolean);
}

// 提取剧集的季数和基础名称
function extractSeasonInfo(name) {
  if (!name) return { baseName: "", seasonNum: 1 };
  
  // 匹配中文季数：第X季
  const zhMatch = name.match(/第([一二三四五六七八九十\d]+)[季部]/);
  if (zhMatch) {
    const val = zhMatch[1];
    const sNum = CHINESE_NUM_MAP[val] || parseInt(val) || 1;
    const bName = name.replace(/第[一二三四五六七八九十\d]+[季部]/, '').trim();
    return { baseName: bName, seasonNum: sNum };
  }
  
  // 匹配数字尾缀
  const digitMatch = name.match(/(.+?)(\d+)$/);
  if (digitMatch) {
    return { baseName: digitMatch[1].trim(), seasonNum: parseInt(digitMatch[2]) || 1 };
  }
  
  return { baseName: name.trim(), seasonNum: 1 };
}

// 判断是否为 m3u8
const isM3U8 = (url) => url?.toLowerCase().includes('.m3u8') || false;

// ================= 4. 核心：资源嗅探与提取逻辑 =================

async function loadResource(params) {
  const { seriesName, type = 'movie', season, episode, customSites } = params;
  if (!seriesName) return [];

  console.log(`[嗅探启动] 寻找: ${seriesName} | 类型: ${type} | 季: ${season} | 集: ${episode}`);

  const sites = parseSites(customSites);
  const targetInfo = extractSeasonInfo(seriesName);
  
  const targetSeason = season ? parseInt(season) : targetInfo.seasonNum;
  const targetEpisode = episode ? parseInt(episode) : null;
  const targetBaseName = targetInfo.baseName;

  // 并发请求所有配置的资源站
  const fetchTasks = sites.map(async (site) => {
    try {
      const res = await Widget.http.get(site.url, {
        params: { ac: "detail", wd: targetBaseName, out: "json" },
        timeout: 8000
      });
      
      let data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      const list = data.list || [];
      if (list.length === 0) return [];

      let siteResults = [];

      // 遍历搜索结果，进行精准匹配
      for (const item of list) {
        const itemInfo = extractSeasonInfo(item.vod_name);
        
        // 【关键过滤】: 核心名称和季数必须匹配
        if (!item.vod_name.includes(targetBaseName)) continue;
        if (type === 'tv' && itemInfo.seasonNum !== targetSeason) continue;

        const playUrls = item.vod_play_url || "";
        const playFroms = (item.vod_play_from || "").split("$$$");
        const playerGroups = playUrls.replace(/#+$/, '').split("$$$");

        // 解析该视频的所有线路
        playerGroups.forEach((groupUrl, groupIndex) => {
          const sourceName = playFroms[groupIndex] || `线路${groupIndex + 1}`;
          const episodesList = groupUrl.split("#").filter(Boolean);

          episodesList.forEach(epData => {
            const [epTitle, epUrl] = epData.split("$");
            if (!epUrl || !isM3U8(epUrl)) return;

            // 如果是电视剧，只提取目标集数
            if (type === 'tv' && targetEpisode !== null) {
              const epNumMatch = epTitle.match(/第?(\d+)集?/);
              const currentEpNum = epNumMatch ? parseInt(epNumMatch[1]) : null;
              
              if (currentEpNum === targetEpisode || epTitle.includes(`第${targetEpisode}集`) || epTitle === String(targetEpisode)) {
                siteResults.push({
                  name: `🚀 ${site.title}`,
                  description: `[${sourceName}] ${item.vod_name} ${epTitle}`,
                  url: epUrl.trim()
                });
              }
            } 
            // 如果是电影，提取包含 m3u8 的主线
            else if (type === 'movie') {
               siteResults.push({
                  name: `🚀 ${site.title}`,
                  description: `[${sourceName}] ${item.vod_name} ${epTitle}`,
                  url: epUrl.trim()
                });
            }
          });
        });
      }
      return siteResults;
    } catch (err) {
      // 屏蔽单个站点失败的报错，避免日志轰炸
      return [];
    }
  });

  // 等待所有站点请求完毕，合并结果
  const resultsArray = await Promise.all(fetchTasks);
  const allResources = resultsArray.flat();

  // URL 去重处理
  const uniqueUrls = new Set();
  const finalResources = allResources.filter(res => {
    if (uniqueUrls.has(res.url)) return false;
    uniqueUrls.add(res.url);
    return true;
  });

  console.log(`[嗅探完成] 共找到 ${finalResources.length} 条直链资源`);
  return finalResources;
}
