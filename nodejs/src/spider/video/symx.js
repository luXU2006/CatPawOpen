import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;

// 配置常量
const HOST = 'https://film.symx.club';

// 必须携带的 Header，否则接口会返回非法访问
const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'x-platform': 'web',
    'Referer': HOST
};

async function init(inReq, outResp) {
    return {};
}

/**
 * 首页分类定义
 */
async function home(inReq, outResp) {
    const classes = [
        { "type_id": "1", "type_name": "电视剧" },
        { "type_id": "2", "type_name": "电影" },
        { "type_id": "3", "type_name": "综艺" },
        { "type_id": "4", "type_name": "动漫" },
        { "type_id": "5", "type_name": "短剧" }
    ];
    return { class: classes };
}

/**
 * 首页海报墙：从 category 接口获取推荐内容
 */
async function homeVod(inReq, outResp) {
    try {
        const url = `${HOST}/api/film/category`;
        const res = await req(url, { method: 'get', headers: COMMON_HEADERS });
        const categories = res.data.data;
        
        let videos = [];
        categories.forEach(cat => {
            if (cat.filmList) {
                cat.filmList.forEach(item => {
                    videos.push({
                        vod_id: item.id,
                        vod_name: item.name,
                        vod_pic: item.cover,
                        vod_remarks: item.updateStatus
                    });
                });
            }
        });
        // 随机去重或取前30个
        return { list: _.uniqBy(videos, 'vod_id').slice(0, 30) };
    } catch (e) {
        return { list: [] };
    }
}

/**
 * 分类列表页
 */
async function category(inReq, outResp) {
    const tid = inReq.body.id || "1";
    const pg = inReq.body.page || 1;
    // 接口：categoryId=1&pageNum=1&pageSize=15&sort=updateTime
    const url = `${HOST}/api/film/category/list?categoryId=${tid}&pageNum=${pg}&pageSize=15&sort=updateTime`;
    
    try {
        const res = await req(url, { method: 'get', headers: COMMON_HEADERS });
        const list = res.data.data.list || [];
        const videos = list.map(item => ({
            vod_id: item.id,
            vod_name: item.name,
            vod_pic: item.cover,
            vod_remarks: item.updateStatus
        }));

        return {
            page: pg,
            list: videos
        };
    } catch (e) {
        return { list: [] };
    }
}

/**
 * 详情页：解析 playLineList 获取线路和集数
 */
async function detail(inReq, outResp) {
    const id = inReq.body.id;
    const url = `${HOST}/api/film/detail?id=${id}`;
    
    const res = await req(url, { method: 'get', headers: COMMON_HEADERS });
    const data = res.data.data;

    const froms = [];
    const urls = [];

    if (data.playLineList) {
        data.playLineList.forEach(line => {
            froms.push(line.playerName);
            const episodes = line.lines.map(ep => `${ep.name}$${ep.id}`);
            urls.push(episodes.join('#'));
        });
    }

    const vod = {
        vod_id: id,
        vod_name: data.name,
        vod_pic: data.cover,
        vod_type: data.categoryId, // 也可以映射为文字
        vod_remarks: data.updateStatus,
        vod_content: data.blurb,
        vod_play_from: froms.join('$$$'),
        vod_play_url: urls.join('$$$')
    };

    return { list: [vod] };
}

/**
 * 播放解析：实时请求 parse 接口获取 M3U8 地址
 */
async function play(inReq, outResp) {
    const lineId = inReq.body.id; // 这里的 id 是详情页拿到的 ep.id
    const parseUrl = `${HOST}/api/line/play/parse?lineId=${lineId}`;
    
    try {
        const res = await req(parseUrl, { method: 'get', headers: COMMON_HEADERS });
        const videoUrl = res.data.data; // 接口直接返回最终播放地址

        return {
            parse: 0,
            url: videoUrl,
            header: { 'User-Agent': COMMON_HEADERS['User-Agent'] }
        };
    } catch (e) {
        return { parse: 1, url: parseUrl };
    }
}

/**
 * 搜索逻辑
 */
async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    const pg = inReq.body.page || 1;
    const url = `${HOST}/api/film/search?keyword=${encodeURIComponent(wd)}&pageNum=${pg}&pageSize=10`;
    
    try {
        const res = await req(url, { method: 'get', headers: COMMON_HEADERS });
        const list = res.data.data.list || [];
        const videos = list.map(item => ({
            vod_id: item.id,
            vod_name: item.name,
            vod_pic: item.cover,
            vod_remarks: item.updateStatus
        }));
        return { list: videos };
    } catch (e) {
        return { list: [] };
    }
}

export default {
    meta: {
        key: 'symx',
        name: '影视 ┃ 🏔山有木兮',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/homeVod', homeVod);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
    },
};