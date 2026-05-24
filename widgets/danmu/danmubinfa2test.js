// =============UserScript=============
// @name         并发弹幕 (官方核心精调版)
// @version      2.0.0
// @description  基于 Forward 官方最新弹幕逻辑，融合二改版的并发、颜色重写、繁简互转、数量限制及屏蔽功能。
// @author       Forward & 𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖 & Fix
// =============UserScript=============

WidgetMetadata = {
  id: "danmu_api_Max_binfa_v2",
  title: "并发弹幕 (Pro)",
  version: "2.0.0",
  requiredVersion: "0.0.2",
  description: "基于官方最新逻辑二改：支持繁简互转、数量限制、关键词屏蔽、颜色重写。全局参数支持多个自定义服务器，以换行分割。",
  author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
  site: "https://t.me/MakkaPakkaOvO",
  globalParams: [
    {
      name: "server",
      title: "自定义服务器",
      type: "input",
      description: "多服务器请换行分割，格式如：弹弹play,https://api.dandanplay.net",
      placeholders: [
        {
          title: "弹弹play",
          value: "https://api.dandanplay.net",
        },
      ],
    },
    { 
      name: "maxCount", 
      title: "📊 弹幕数量上限", 
      type: "input", 
      value: "3000",
      description: "填0或留空不限制。超出则按时间全段等比例随机剔除" 
    },
    { 
      name: "searchBlockKeywords", 
      title: "👁️ 搜索结果屏蔽词 (逗号分隔)", 
      type: "input", 
      value: "",
      description: "屏蔽不想看到的搜索结果，如: 动态漫,电视剧,漫画" 
    },
    { 
      name: "convertMode", 
      title: "🔠 弹幕转换", 
      type: "enumeration", 
      value: "none",
      enumOptions: [
          { title: "保持原样", value: "none" },
          { title: "转简体 (繁->简)", value: "t2s" },
          { title: "转繁体 (简->繁)", value: "s2t" }
      ]
    },
    { 
      name: "colorMode", 
      title: "🎨 弹幕颜色", 
      type: "enumeration", 
      value: "none",
      enumOptions: [
          { title: "保持原样", value: "none" },
          { title: "全部纯白", value: "white" },
          { title: "部分彩色 (50%彩色)", value: "partial" },
          { title: "完全彩色 (100%彩色)", value: "all" }
      ]
    },
    { 
      name: "blockKeywords", 
      title: "🚫 弹幕内容屏蔽词 (逗号分隔)", 
      type: "input", 
      value: "" 
    }
  ],
  modules: [
    {
      id: "searchDanmu",
      title: "搜索弹幕",
      functionName: "searchDanmu",
      type: "danmu",
      params: [],
    },
    {
      id: "getDetail",
      title: "获取详情",
      functionName: "getDetailById",
      type: "danmu",
      params: [],
    },
    {
      id: "getComments",
      title: "获取弹幕",
      functionName: "getCommentsById",
      type: "danmu",
      params: [],
    },
  ],
};

// ==========================================
// 1. 繁简转换与颜色核心 (二改功能区)
// ==========================================
const DICT_URL_S2T = "https://cdn.jsdelivr.net/npm/opencc-data@1.0.3/data/STCharacters.txt";
const DICT_URL_T2S = "https://cdn.jsdelivr.net/npm/opencc-data@1.0.3/data/TSCharacters.txt";

let MEM_DICT = null;

async function initDict(mode) {
    if (!mode || mode === "none") return;
    if (MEM_DICT) return; 

    const key = `dict_${mode}`;
    let local = await Widget.storage.get(key);

    if (!local) {
        try {
            const res = await Widget.http.get(mode === "t2s" ? DICT_URL_T2S : DICT_URL_S2T);
            local = res.data;
            await Widget.storage.set(key, local);
        } catch (e) {
            console.error("字典加载失败", e);
            return;
        }
    }

    MEM_DICT = new Map();
    const lines = local.split('\n');
    for (let line of lines) {
        if (!line) continue;
        const [from, to] = line.split('\t');
        if (from && to) {
            MEM_DICT.set(from, to.split(' ')[0]);
        }
    }
}

function convertText(text) {
    if (!MEM_DICT || !text) return text;
    let res = "";
    for (let char of text) {
        res += MEM_DICT.get(char) || char;
    }
    return res;
}

// ==========================================
// 2. 官方核心逻辑区 (Danmu.js v1.1.6 基础)
// ==========================================
const DEFAULT_DANMU_SERVER = "https://api.dandanplay.net";
const DANMU_SERVER_ID_SEPARATOR = "__FORWARD_DANMU_SERVER__";
const DANMU_SOURCE_BATCH_SIZE = 5;

function normalizeDanmuServer(server) {
  return String(server || "").trim().replace(/\/+$/, "");
}

function getDanmuSourceTitle(server) {
  try {
    return new URL(server).host || server;
  } catch (error) {
    return server;
  }
}

function looksLikeServerAddress(value) {
  return /^(https?:\/\/|localhost\b|127\.0\.0\.1\b)/i.test(value);
}

function makeDanmuSource(title, server, explicitTitle) {
  const normalizedServer = normalizeDanmuServer(server);
  const normalizedTitle = String(title || "").trim();
  return {
    title: normalizedTitle || getDanmuSourceTitle(normalizedServer),
    server: normalizedServer,
    explicitTitle: Boolean(explicitTitle && normalizedTitle),
  };
}

function parseDanmuSourceLine(line) {
  const separatorMatch = line.match(/[，,]/);
  if (!separatorMatch) {
    return makeDanmuSource("", line, false);
  }

  const separatorIndex = separatorMatch.index;
  const title = line.slice(0, separatorIndex).trim();
  const server = line.slice(separatorIndex + separatorMatch[0].length).trim();

  if (!server && looksLikeServerAddress(title)) {
    return makeDanmuSource("", title, false);
  }

  return makeDanmuSource(title, server, true);
}

function getDanmuSources(server) {
  const serverValue = Array.isArray(server) ? server.join("\n") : server;
  const rawValue = String(serverValue || "").trim();

  if (!rawValue) {
    return [makeDanmuSource("弹弹play", DEFAULT_DANMU_SERVER, true)];
  }

  const lines = rawValue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 1) {
    const commaParts = lines[0].split(/[，,]/).map((item) => item.trim()).filter(Boolean);
    if (commaParts.length > 1 && commaParts.every(looksLikeServerAddress)) {
      return dedupeDanmuSources(commaParts.map((item) => makeDanmuSource("", item, false)));
    }
  }

  return dedupeDanmuSources(lines.map(parseDanmuSourceLine).filter((source) => source.server));
}

function dedupeDanmuSources(sources) {
  const sourceMap = new Map();
  for (const source of sources) {
    if (!sourceMap.has(source.server)) {
      sourceMap.set(source.server, source);
    }
  }
  return Array.from(sourceMap.values());
}

function bindDanmuServerId(id, source, shouldBind) {
  if (!shouldBind || id === undefined || id === null) {
    return id;
  }

  const payload = JSON.stringify({
    title: source.title,
    server: source.server,
  });

  return `${encodeURIComponent(payload)}${DANMU_SERVER_ID_SEPARATOR}${id}`;
}

function parseDanmuServerId(id) {
  if (typeof id !== "string") {
    return { id, source: null };
  }

  const separatorIndex = id.indexOf(DANMU_SERVER_ID_SEPARATOR);
  if (separatorIndex === -1) {
    return { id, source: null };
  }

  const encodedSource = id.slice(0, separatorIndex);
  const rawId = id.slice(separatorIndex + DANMU_SERVER_ID_SEPARATOR.length);
  const decodedSource = decodeURIComponent(encodedSource);

  try {
    const source = JSON.parse(decodedSource);
    if (source && source.server) {
      return { id: rawId, source };
    }
  } catch (error) {
    console.error("解析弹幕服务器 ID 失败:", error);
  }

  return { id, source: null };
}

function getDanmuHeaders() {
  return {
    Accept: "application/json",
  };
}

function getDanmuRequestSources(serverParam, targetSource) {
  const sources = getDanmuSources(serverParam);

  if (!targetSource) {
    return sources;
  }

  const matchedSource = sources.find((source) => source.server === targetSource.server);
  if (matchedSource) {
    return [matchedSource];
  }

  return [targetSource, ...sources];
}

async function searchDanmu(params) {
  const { server, title } = params;

  if (!title) {
    throw new Error("搜索关键词不能为空");
  }

  const sources = getDanmuSources(server);
  const promises = [];

  for (const source of sources) {
    promises.push(
      (async () => {
        try {
          const response = await Widget.http.get(
            `${source.server}/api/v2/search/episodes?anime=${encodeURIComponent(title)}`,
            {
              headers: getDanmuHeaders(),
            }
          );
          return { source, data: response?.data || {} };
        } catch (error) {
          throw Object.assign(error, { source });
        }
      })()
    );
  }

  const results = await Promise.allSettled(promises);
  let allAnimes = [];
  let hasSuccessfulResponse = false;
  let lastError = null;

  for (const result of results) {
    if (result.status === "fulfilled") {
      hasSuccessfulResponse = true;
      const { source, data } = result.value;
      const animes = data.animes || [];

      const boundAnimes = animes.map((anime) => {
        const boundAnimeId = bindDanmuServerId(anime.animeId, source, sources.length > 1);
        const sourceTitleStr = source.explicitTitle || sources.length > 1 ? `[${source.title}] ` : "";
        return {
          ...anime,
          animeId: boundAnimeId,
          animeTitle: `${sourceTitleStr}${anime.animeTitle}`,
        };
      });
      allAnimes = allAnimes.concat(boundAnimes);
    } else {
      const { source, ...error } = result.reason;
      lastError = error;
      console.error(`请求 ${source.server} 失败:`, error);
    }
  }

  if (hasSuccessfulResponse) {
    // ----------------------------------------------------
    // ✨ 二改逻辑: 过滤搜索结果
    // ----------------------------------------------------
    const blockKeywordsStr = params.searchBlockKeywords;
    if (blockKeywordsStr) {
      const blockKeywords = blockKeywordsStr.split(',').map(k => k.trim()).filter(k => k);
      if (blockKeywords.length > 0) {
        allAnimes = allAnimes.filter(anime => {
          const title = anime.animeTitle || "";
          return !blockKeywords.some(keyword => title.includes(keyword));
        });
      }
    }
    
    return { animes: allAnimes };
  }

  throw lastError || new Error("获取数据失败");
}

async function getDetailById(params) {
  const { server, animeId } = params;

  if (!animeId) {
    throw new Error("动漫ID不能为空");
  }

  const parsedAnimeId = parseDanmuServerId(animeId);
  const sources = getDanmuRequestSources(server, parsedAnimeId.source);
  let lastError = null;
  let hasSuccessfulResponse = false;
  let allEpisodes = [];

  for (const source of sources) {
    try {
      const response = await Widget.http.get(
        `${source.server}/api/v2/anime/${parsedAnimeId.id}`,
        {
          headers: getDanmuHeaders(),
        }
      );

      if (response && response.data) {
        hasSuccessfulResponse = true;
        const data = response.data;
        const episodes = data.anime?.episodes || data.episodes || [];
        const boundEpisodes = episodes.map((episode) => {
          const boundEpisodeId = bindDanmuServerId(
            episode.episodeId,
            source,
            sources.length > 1
          );
          return {
            ...episode,
            episodeId: boundEpisodeId,
          };
        });

        allEpisodes = allEpisodes.concat(boundEpisodes);
      }
    } catch (error) {
      lastError = error;
      console.error(`请求 ${source.server} 失败:`, error);
    }
  }

  if (hasSuccessfulResponse) {
    return { episodes: allEpisodes };
  }

  throw lastError || new Error("获取数据失败");
}

async function getCommentsById(params) {
  const { server, commentId } = params;

  if (commentId) {
    const parsedCommentId = parseDanmuServerId(commentId);
    const sources = getDanmuRequestSources(server, parsedCommentId.source);
    let lastError = null;

    for (const source of sources) {
      try {
        const response = await Widget.http.get(
          `${source.server}/api/v2/comment/${parsedCommentId.id}?async=1&withRelated=true&chConvert=1`,
          {
            headers: getDanmuHeaders(),
          }
        );

        if (response && response.data) {
          let data = response.data;
          let list = data.comments || [];
          
          // ----------------------------------------------------
          // ✨ 二改逻辑: 拦截并处理弹幕内容
          // ----------------------------------------------------
          const { maxCount, blockKeywords, convertMode, colorMode } = params;

          // 1. 弹幕屏蔽词过滤
          if (blockKeywords) {
              const blocks = blockKeywords.split(',').map(k => k.trim()).filter(k => k);
              if (blocks.length > 0) {
                  list = list.filter(c => {
                      const text = c.m || "";
                      return !blocks.some(b => text.includes(b));
                  });
              }
          }

          // 2. 繁简转换
          if (convertMode && convertMode !== "none") {
              await initDict(convertMode);
              if (MEM_DICT) {
                  list.forEach(c => {
                      if (c.m) c.m = convertText(c.m);
                  });
              }
          }

          // 3. 弹幕数量上限等比例剔除
          if (maxCount) {
              const max = parseInt(maxCount);
              if (!isNaN(max) && max > 0 && list.length > max) {
                  // 先按时间排序
                  list.sort((a, b) => {
                      const timeA = a.p ? parseFloat(a.p.split(',')[0]) : 0;
                      const timeB = b.p ? parseFloat(b.p.split(',')[0]) : 0;
                      return timeA - timeB;
                  });

                  // 随机剔除
                  const retainRatio = max / list.length;
                  list = list.filter(() => Math.random() < retainRatio);
                  
                  // 兜底截断
                  if (list.length > max) {
                      list = list.slice(0, max);
                  }

                  // 再次按时间排序，确保播放器读取正常
                  list.sort((a, b) => {
                      const timeA = a.p ? parseFloat(a.p.split(',')[0]) : 0;
                      const timeB = b.p ? parseFloat(b.p.split(',')[0]) : 0;
                      return timeA - timeB;
                  });
              }
          }

          // 4. 颜色重写
          if (colorMode && colorMode !== "none") {
              const COLORS = [
                  16711680, 16776960, 16752384, 16738740, 13445375, 11730943, 11730790
              ];
              const COLOR_WHITE = "16777215";

              list.forEach(c => {
                  if (c.p) {
                      let parts = c.p.split(',');
                      if (parts.length >= 3) {
                          // Dandanplay p参数: time,mode,color,userid
                          // 老版本可能有8个参数，兼容处理一下
                          let colorIndex = parts.length >= 8 ? 3 : 2; 

                          let targetColor = COLOR_WHITE;
                          if (colorMode === "white") {
                              targetColor = COLOR_WHITE;
                          } else if (colorMode === "partial") {
                              targetColor = Math.random() < 0.5 
                                  ? COLORS[Math.floor(Math.random() * COLORS.length)].toString() 
                                  : COLOR_WHITE;
                          } else if (colorMode === "all") {
                              targetColor = COLORS[Math.floor(Math.random() * COLORS.length)].toString();
                          }
                          
                          parts[colorIndex] = targetColor;
                          c.p = parts.join(',');
                      }
                  }
              });
          }
          
          data.comments = list;
          return data;
        }

        lastError = new Error("获取数据失败");
      } catch (error) {
        lastError = error;
        console.error(`请求 ${source.server} 失败:`, error);
      }
    }

    throw lastError || new Error("获取数据失败");
  }

  // 以下为根据视频参数精准匹配 (旧逻辑备用，但官方推荐优先通过commentId获取)
  const sources = getDanmuSources(server);
  const promises = [];

  for (let i = 0; i < sources.length; i += DANMU_SOURCE_BATCH_SIZE) {
    const batchSources = sources.slice(i, i + DANMU_SOURCE_BATCH_SIZE);
    const batchPromises = batchSources.map((source) =>
      (async () => {
        try {
          const body = {
            anime: params.title,
            episode: params.episodeName,
            season: params.season,
            ep: params.episode,
          };
          const response = await Widget.http.post(
            `${source.server}/api/v2/extcomment`,
            body,
            { headers: getDanmuHeaders() }
          );
          return { source, data: response?.data };
        } catch (error) {
          throw Object.assign(error, { source });
        }
      })()
    );
    promises.push(...batchPromises);
  }

  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === "fulfilled" && result.value?.data) {
       // 这里如果触发也可以考虑复用拦截逻辑，不过目前主流靠 commentId
       return result.value.data;
    } else if (result.status === "rejected") {
      console.error(`请求 ${result.reason.source.server} 失败:`, result.reason);
    }
  }

  throw new Error("获取数据失败");
}
