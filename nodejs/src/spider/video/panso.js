import {init as _init, detail as _detail, proxy, play, getPanInfos} from '../../util/pan.js';
import axios from "axios";
import https from "https";
import dayjs from "dayjs";

const _http = axios.create({
  timeout: 60 * 1000,
  httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
  baseURL: "https://so.252035.xyz",
});

async function init(inReq, _outResp) {
  await _init(inReq, _outResp);
  return {};
}

async function home(_inReq, _outResp) {
  return {
    class: [],
  };
}

async function category(inReq, _outResp) {
  return {
    page: 1,
    pagecount: 1,
    list: [],
  };
}

async function detail(inReq, _outResp) {
  const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
  const videos = [];
  
  for (const id of ids) {
    const vodFromUrl = await _detail(id);
    const vod = {};
    if (vodFromUrl) {
      vod.vod_id = id;
      vod.vod_name = vodFromUrl.vod_name || id;
      vod.vod_play_from = vodFromUrl.froms;
      vod.vod_play_url = vodFromUrl.urls;
      if(vodFromUrl.vod_pic) vod.vod_pic = vodFromUrl.vod_pic; 
    }
    videos.push(vod);
  }
  
  return {
    list: videos,
  };
}

async function search(inReq, _outResp) {
  const wd = inReq.body.wd;
  
  const panTypes = {
    quark: "quark",
    uc: "uc",
    pikpak: "pikpak",
    xunlei: "xunlei",
    a123: "123",
    a189: "tianyi",
    a139: "mobile",
    a115: "115",
  };

  const panPic = {
    ali: "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/ali.jpg",
    quark: "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/quark.png",
    uc: "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/uc.png",
    pikpak: "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/pikpak.jpg",
    xunlei: "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/thunder.png",
    '123': "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/123.png",
    tianyi: "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/189.png",
    mobile: "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/139.jpg",
    '115': "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/115.jpg",
  };

  const availablePans = getPanInfos();

  const cloudTypes = Object.values(panTypes);
  
  let ret;
  try {
    const res = await _http.post("/api/search", {
      kw: wd,
      cloud_types: cloudTypes,
    });
    ret = res.data;
  } catch (e) {
    return { page: 1, pagecount: 1, list: [] };
  }

  if (ret.code !== 0) {
    return { page: 1, pagecount: 1, list: [] };
  }

  const rawItems = [];
  
  for (const key in ret.data.merged_by_type || {}) {
    const panKey = Object.keys(panTypes).find((k) => panTypes[k] === key);
    const pic = panPic[key];

    for (const row of ret.data.merged_by_type[key] || []) {
      const isSupported = availablePans.some(pan => pan.validator(row.url));
      
      if (isSupported) {
        rawItems.push({
          row,
          panKey,
          pic,
          apiType: key
        });
      }
    }
  }

  if (rawItems.length === 0) {
    return { page: 1, pagecount: 1, list: [] };
  }

  const uniqueLinks = [...new Set(rawItems.map((it) => it.row.url))];
  const VALID_STATUS = ["valid_links"];
  let validLinksSet = new Set();

  try {
    const checkRes = await axios.post(
      "https://pancheck.banye.tech:7777/api/v1/links/check",
      {
        links: uniqueLinks,
        selected_platforms: [
          "quark", "uc", "tianyi", "pan123", "pan115", "xunlei", "cmcc",
        ],
      },
      {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const checkData = checkRes.data;
    for (const status of VALID_STATUS) {
      (checkData[status] || []).forEach((link) => validLinksSet.add(link));
    }
  } catch (e) {
    uniqueLinks.forEach((l) => validLinksSet.add(l));
  }

  const filteredItems = rawItems.filter((it) => validLinksSet.has(it.row.url));
  const rs = [];
  const currentTime = dayjs();

  for (const it of filteredItems) {
    const { row, panKey, pic } = it;

    const rowTime = dayjs(row.datetime);
    const timeDiff = currentTime.diff(rowTime, "minute");
    const dt = dayjs(
      timeDiff <= 70 && timeDiff >= 0 ? "0001-01-01T00:00:00Z" : row.datetime
    );
    const source = row.source ? row.source.replace(/plugin:/gi, "plg:") : "";

    rs.push({
      vod_id: row.url,
      vod_name: row.note,
      vod_pic: pic,
      vod_remarks: `${source || panKey} | ${dt.format("MMDDYY")}`,
      _time: dt.unix(),
      _pan: panKey,
    });
  }

  const orderList = ["quark", "uc", "a115", "a123", "a189", "xunlei", "pikpak", "a139"];
  const orderMap = orderList.reduce((map, key, idx) => {
    map[key] = idx;
    return map;
  }, {});

  const qualityKeywords = [
    'HDR', '杜比视界', 'DV',
    'REMUX', 'HQ', "臻彩",'高码', '高画质',
    '60FPS', '60帧', '高帧率', '60HZ',
    "4K", "2160P",
    "SDR", "1080P", "HD", "高清",
    "720P", "标清",
  ];

  const completedKeywords = ["完结", "全集", "已完成", "全"];

  const getQualityScore = (name) => {
    const upper = String(name).toUpperCase();
    let score = 0, cnt = 0;
    for (let i = 0; i < qualityKeywords.length; i++) {
      if (upper.includes(qualityKeywords[i].toUpperCase())) {
        score += qualityKeywords.length - i;
        cnt++;
      }
    }
    return score + cnt;
  };

  const getCount = (name, arr) => {
    const upper = String(name).toUpperCase();
    let c = 0;
    for (const kw of arr) {
      if (upper.includes(kw.toUpperCase())) c++;
    }
    return c;
  };

  rs.sort((a, b) => {
    const oa = orderMap[a._pan] ?? 999;
    const ob = orderMap[b._pan] ?? 999;
    if (oa !== ob) return oa - ob;

    const qa = getQualityScore(a.vod_name);
    const qb = getQualityScore(b.vod_name);
    if (qa !== qb) return qb - qa;

    const ca = getCount(a.vod_name, completedKeywords);
    const cb = getCount(b.vod_name, completedKeywords);
    if (ca !== cb) return cb - ca;

    const qa2 = getCount(a.vod_name, qualityKeywords);
    const qb2 = getCount(b.vod_name, qualityKeywords);
    if (qa2 !== qb2) return qb2 - qa2;

    if (b._time !== a._time) return b._time - a._time;

    return 0;
  });

  rs.forEach(item => {
    delete item._time;
    delete item._pan;
  });

  return {
    page: 1,
    pagecount: 1,
    list: rs,
  };
}

export default {
  meta: {
    key: 'panso',
    name: '网盘 ┃💿盘搜(仅搜索)',
    type: 3,
  },
  api: async (fastify) => {
    fastify.post('/init', init);
    fastify.post('/home', home);
    fastify.post('/category', category);
    fastify.post('/detail', detail);
    fastify.post('/play', play);
    fastify.post('/search', search);
    fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
  },
};