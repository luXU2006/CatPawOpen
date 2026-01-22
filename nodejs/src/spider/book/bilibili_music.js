import req from '../../util/req.js';
import pkg from 'lodash';
import crypto from 'crypto';

const { _ } = pkg;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
const REFERER = 'https://www.bilibili.com/';

let SITE_COOKIE = '';

function createGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
}

function generateGuestCookie() {
    const _uuid = createGuid() + 'infoc';
    const buvid3 = createGuid() + 'infoc';
    const b_lsid = createGuid().replace(/-/g, '').substring(0, 20).toUpperCase();
    const time = Date.now();
    return `_uuid=${_uuid}; buvid3=${buvid3}; b_lsid=${b_lsid}; b_nut=${Math.floor(time / 1000)}; CURRENT_FNVAL=16; home_feed_column=4`;
}

const MY_COLLECTIONS = [
    'BV1WUsDezE88', // 2024流行歌曲
    'BV1xYWBeMERL', // 2024网易云热歌榜
    'BV11yeTzNE4s', // 经典老歌
    'BV1av4y1R7xK', // BEYOND - 精选合集
    'BV1q4FTeBEMj', // 周杰伦
    'BV1CC411j7pi', // 邓紫棋
    'BV1zaNGeMENj', // 张靓颖
    'BV1884y1C7VM', // 张杰
    'BV1Yu41187Xg', // 陈奕迅
    'BV1XM4y1J7jF', // 陶喆
    'BV1Cx4y1j7U5', // 周深
    'BV1Hk4y1W7MJ', // 薛之谦
    'BV1fhbUz4Eex', // 粤语歌曲
    'BV1GdJQzvEyh', // 2025流行歌曲
    'BV1qFuQz2EVx', // 一人一首成名曲
];

const MY_AUDIOBOOKS = [
    'BV145411o785', // 杨哥严选全网最棒《睡前故事合集①》
    'BV1gc411F7Tz', // 杨哥严选全网最棒《睡前故事合集②》
    'BV14T411S7Sg', // 安徒生童话合集
    'BV1fd4y157H2', // 格林童话合集
    'BV1uTwAeXEoH', // 福尔摩斯探案集
    'BV1dx4y1B781', // 科幻有声小说【刘慈欣】作品合集
    'BV1fbywBjEbU', // 《鬼吹灯》八部全
    'BV1JQBaBHEso', // 《盗墓笔记》
    'BV1Er421G7N8', // 《盗墓笔记续9》
    'BV1wgBoB4EPN', // 有声书《剑来》玄幻/仙侠/多人小说剧
    'BV1UyB4BDEwz', // 《仙逆》33.5个小时！原著小说全本精讲
    'BV1bW411n7fs', // 有声书《吞噬星空》科幻 | 无删减完结 共1304集
];

const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
];

let wbiKeys = null;

async function request(url, opts = {}) {
    if (!SITE_COOKIE) {
        SITE_COOKIE = generateGuestCookie();
    }

    const headers = {
        'User-Agent': USER_AGENT,
        'Referer': REFERER,
        'Cookie': SITE_COOKIE, 
        ...opts.headers
    };
    
    try {
        let res = await req(url, {
            method: opts.method || 'get',
            headers: headers,
            data: opts.data
        });
        return res.data;
    } catch (e) {
        console.error('Request error:', url, e);
        return null;
    }
}

function getMixinKey(orig) {
    let s = '';
    for (let i of mixinKeyEncTab) {
        if (i < orig.length) {
            s += orig[i];
        }
    }
    return s.slice(0, 32);
}

function encWbi(params, img_key, sub_key) {
    const mixin_key = getMixinKey(img_key + sub_key);
    const curr_time = Math.round(Date.now() / 1000);
    const chr_filter = /[!'\(\)*]/g;
    
    const sortedKeys = Object.keys(params).sort();
    let queryArr = [];
    
    for (let key of sortedKeys) {
        let value = params[key];
        if (value instanceof Object) value = JSON.stringify(value);
        value = (value + '').replace(chr_filter, '');
        queryArr.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    
    queryArr.push(`wts=${curr_time}`);
    const queryStr = queryArr.join('&');
    const w_rid = crypto.createHash('md5').update(queryStr + mixin_key).digest('hex');
    return `${queryStr}&w_rid=${w_rid}`;
}

async function getWbiKeys() {
    if (wbiKeys) return wbiKeys;
    try {
        const json = await request('https://api.bilibili.com/x/web-interface/nav');
        if (json && json.data && json.data.wbi_img) {
            const img_url = json.data.wbi_img.img_url;
            const sub_url = json.data.wbi_img.sub_url;
            wbiKeys = {
                img_key: img_url.substring(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.')),
                sub_key: sub_url.substring(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.'))
            };
            return wbiKeys;
        }
    } catch (e) {
    }
    return { img_key: '7cd084941338484aae1ad9425b84077c', sub_key: '4932caff0a9246c0a71c518d724a92c3' };
}

function formatDuration(seconds) {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

async function init(inReq, _outResp) {
    await getWbiKeys();
    return {};
}

async function home(filter) {
    return ({
        class: [
            { type_id: 'fav_collection', type_name: '精选歌单' },
            { type_id: 'fav_audiobook', type_name: '精选听书' }
        ],
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = parseInt(inReq.body.page || 1);
    
    let books = [];
    let total = 0;
    let limit = 20;

    if (tid === 'fav_collection' || tid === 'fav_audiobook') {
        if (pg === 1) {
            const targetList = (tid === 'fav_collection') ? MY_COLLECTIONS : MY_AUDIOBOOKS;

            const promises = targetList.map(async (bvid) => {
                try {
                    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
                    const content = await request(url);
                    if (content && content.code === 0 && content.data) {
                        const data = content.data;
                        return {
                            book_id: bvid,
                            book_name: data.title,
                            book_pic: data.pic,
                            book_remarks: `🎵 ${data.videos || data.pages?.length || '?'}集`, 
                        };
                    }
                } catch (e) {
                }
                return null;
            });
            
            const results = await Promise.all(promises);
            books = results.filter(item => item !== null);
            total = books.length;
            limit = 100;
        }
    } else {
        let url = `https://api.bilibili.com/x/web-interface/newlist?rid=${tid}&type=0&pn=${pg}&ps=20`;
        let content = await request(url);
        if (content && content.data && content.data.archives) {
            const data = content.data;
            total = data.page?.count || 100;
            for (const item of data.archives) {
                books.push({
                    book_id: item.bvid,
                    book_name: item.title,
                    book_pic: item.pic,
                    book_remarks: formatDuration(item.duration),
                });
            }
        }
    }

    return ({
        page: pg,
        pagecount: (tid === 'fav_collection' || tid === 'fav_audiobook') ? 1 : Math.ceil(total / limit),
        limit: limit,
        total: total,
        list: books,
    });
}

async function detail(inReq, _outResp) {
    const bvid = inReq.body.id;
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    let content = await request(url);
    
    if (!content || !content.data) {
        return { list: [] };
    }

    let data = content.data;

    let book = {
        audio: 1,
        book_id: bvid,
        book_name: data.title,
        book_pic: data.pic,
        type_name: data.tname,
        book_year: data.pubdate ? new Date(data.pubdate * 1000).getFullYear().toString() : '',
        book_area: 'Bilibili',
        book_remarks: data.owner ? data.owner.name : '',
        book_actor: data.owner ? data.owner.name : '',
        book_director: '',
        book_content: data.desc || '',
    };

    let us = [];
    if (data.pages) {
        us = _.map(data.pages, function (b) {
            const title = b.part || b.from || data.title;
            return formatPlayUrl(title) + '$' + bvid + '+' + b.cid;
        });
    } else {
        us.push(formatPlayUrl(data.title) + '$' + bvid + '+' + data.cid);
    }

    book.volumes = '默认列表';
    book.urls = us.join('#');

    return ({
        list: [book],
    });
}

function formatPlayUrl(name) {
    return name
        .trim()
        .replace(/<|>|《|》/g, '')
        .replace(/\$|#/g, ' ')
        .trim();
}

async function play(inReq, _outResp) {
    const id = inReq.body.id; 
    const parts = id.split('+');
    const bvid = parts[0];
    const cid = parts[1];

    const url = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=64&fnval=16&fnver=0&fourk=1`;
    
    let content = await request(url);
    let playUrl = '';
    
    if (content && content.data && content.data.dash && content.data.dash.audio) {
        let audios = content.data.dash.audio;
        if (audios.length > 0) {
            audios.sort((a, b) => b.bandwidth - a.bandwidth);
            playUrl = audios[0].baseUrl;
        }
    } 
    
    if (!playUrl && content && content.data && content.data.durl) {
        playUrl = content.data.durl[0].url;
    }

    return ({
        parse: 0,
        url: playUrl,
        header: {
            'User-Agent': USER_AGENT,
            'Referer': REFERER
        }
    });
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = parseInt(inReq.body.page || 1);

    const keys = await getWbiKeys();
    
    const params = {
        keyword: wd,
        page: pg,
        search_type: 'video' 
    };

    const query = encWbi(params, keys.img_key, keys.sub_key);
    const url = `https://api.bilibili.com/x/web-interface/wbi/search/type?${query}`;
    
    let content = await request(url);
    
    let books = [];
    if (content && content.data && content.data.result) {
        let data = content.data;
        for (const item of data.result) {
            books.push({
                book_id: item.bvid,
                book_name: item.title.replace(/<[^>]*>/g, ''),
                book_pic: item.pic.startsWith('//') ? 'https:' + item.pic : item.pic,
                book_remarks: item.author,
            });
        }
        return ({
            page: data.page,
            pagecount: data.numPages,
            limit: data.pagesize,
            total: data.numResults,
            list: books,
        });
    }

    return ({
        page: 1,
        pagecount: 1,
        limit: 20,
        total: 0,
        list: [],
    });
}

async function test(inReq, outResp) {
    try {
        const prefix = inReq.server.prefix;
        const dataResult = {};
        
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        
        if (dataResult.home.class && dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: 'fav_audiobook', 
                page: 1,
            });
            dataResult.category = resp.json();
        }
        
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'bilibili_music',
        name: '音频 ┃ 🎧哔哩哔哩',
        type: 10,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};