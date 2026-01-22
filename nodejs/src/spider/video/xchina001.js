import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';
import { load } from 'cheerio';
import axios from 'axios';

let HOST = 'https://xchina001.site';

const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const BASE_HEADERS = {
    'User-Agent': UA,
    Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    Referer: HOST,
};

async function requestPage(reqUrl, headers = {}) {
    const res = await req(reqUrl, {
        method: 'get',
        headers: {
            ...BASE_HEADERS,
            ...headers,
        },
    });
    return res.data;
}

function resolveUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    try {
        return new URL(url, HOST).href;
    } catch (e) {
        return url;
    }
}

function extractVideoItems(html) {
    const vods = [];
    const videoDivRegex = /<div[^>]*class="item\s+video[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    while ((match = videoDivRegex.exec(html)) !== null) {
        const item = match[1];
        const linkRegex = /<a[^>]*href="(.*?)"[^>]*title="(.*?)"[^>]*>/;
        const linkMatch = linkRegex.exec(item);
        if (linkMatch) {
            let href = linkMatch[1];
            const title = linkMatch[2];
            let img = '';
            const imgRegex = /background-image:url\((.*?)\)/;
            const imgMatch = imgRegex.exec(item);
            if (imgMatch) {
                img = imgMatch[1].trim().replace(/^['"]|['"]$/g, '');
                img = resolveUrl(img);
            }
            vods.push({
                vod_id: href,
                vod_name: (title || '').trim(),
                vod_pic: img,
                vod_remarks: '',
            });
        }
    }
    if (!vods.length) {
        const generalRegex = /<a[^>]*href="(\/videos\/.*?)"[^>]*title="(.*?)"[^>]*>/g;
        let m;
        while ((m = generalRegex.exec(html)) !== null) {
            const href = m[1];
            const title = m[2];
            const fullHref = resolveUrl(href);
            vods.push({
                vod_id: fullHref,
                vod_name: (title || '').trim(),
                vod_pic: '',
                vod_remarks: '',
            });
        }
    }
    return vods;
}

async function init(inReq, outResp) {
    console.log(`使用站点: ${HOST}`);
    return {};
}

async function home(inReq, outResp) {
    const classes = [
        { type_name: '麻豆传媒', type_id: '/videos/series-5f904550b8fcc.html' },
        { type_name: '独立创作者', type_id: '/videos/series-61bf6e439fed6.html' },
        { type_name: '糖心Vlog', type_id: '/videos/series-61014080dbfde.html' },
        { type_name: '蜜桃传媒', type_id: '/videos/series-5fe8403919165.html' },
        { type_name: '星空传媒', type_id: '/videos/series-6054e93356ded.html' },
        { type_name: '天美传媒', type_id: '/videos/series-60153c49058ce.html' },
        { type_name: '果冻传媒', type_id: '/videos/series-5fe840718d665.html' },
        { type_name: '香蕉视频', type_id: '/videos/series-65e5f74e4605c.html' },
        { type_name: '精东影业', type_id: '/videos/series-60126bcfb97fa.html' },
        { type_name: '爱豆传媒', type_id: '/videos/series-63d134c7a0a15.html' },
        { type_name: '杏吧原版', type_id: '/videos/series-6072997559b46.html' },
        { type_name: 'IBiZa Media', type_id: '/videos/series-64e9cce89da21.html' },
        { type_name: '性视界', type_id: '/videos/series-63490362dac45.html' },
        { type_name: 'ED Mosaic', type_id: '/videos/series-63732f5c3d36b.html' },
        { type_name: '大象传媒', type_id: '/videos/series-65bcaa9688514.html' },
        { type_name: '扣扣传媒', type_id: '/videos/series-6230974ada989.html' },
        { type_name: '萝莉社', type_id: '/videos/series-6360ca9706ecb.html' },
        { type_name: 'SA国际传媒', type_id: '/videos/series-633ef3ef07d33.html' },
        { type_name: '其他中文AV', type_id: '/videos/series-63986aec205d8.html' },
    ];
    return JSON.stringify({
        class: classes,
        filters: {},
    });
}

async function homeVod(inReq, outResp) {
    try {
        const html = await requestPage(HOST);
        const vods = extractVideoItems(html);
        return {
            list: vods,
        };
    } catch (e) {
        console.error('homeVod error:', e);
        return {
            list: [],
        };
    }
}

async function category(inReq, _outResp) {
    try {
        let tid = inReq.body.id;
        let pg = parseInt(inReq.body.page || 1, 10);
        const extend = inReq.body.filters || {};
        let url = '';
        if (tid && tid.startsWith('http')) {
            url = tid;
        } else {
            url = resolveUrl(tid || '/');
        }
        if (pg > 1) {
            url += url.includes('?') ? `&page=${pg}` : `?page=${pg}`;
        }
        const html = await requestPage(url);
        const vods = extractVideoItems(html);
        const currentPageItems = vods.length;
        const hasNextPage =
            html.includes('下一页') ||
            html.toLowerCase().includes('next') ||
            html.includes(`page=${pg + 1}`);
        const pagecount = hasNextPage ? pg + 1 : pg;
        const total = hasNextPage ? pagecount * currentPageItems : currentPageItems;
        return JSON.stringify({
            page: pg,
            pagecount,
            limit: currentPageItems,
            total,
            list: vods,
        });
    } catch (e) {
        console.error('category error:', e);
        const pg = parseInt(inReq.body.page || 1, 10);
        return JSON.stringify({
            page: pg,
            pagecount: 1,
            limit: 30,
            total: 0,
            list: [],
        });
    }
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (const vid of ids) {
        const url = vid && vid.includes('http') ? vid : resolveUrl(vid || '/');
        const vod = {
            vod_id: vid,
            vod_name: '小黄书视频',
            vod_pic: '',
            type_name: '',
            vod_year: '',
            vod_area: '',
            vod_remarks: '',
            vod_actor: '',
            vod_director: '',
            vod_content: '',
        };
        try {
            const html = await requestPage(url);
            const $ = load(html);
            let name = $('h1').first().text().trim();
            if (!name) {
                const fullTitle = $('title').first().text().trim();
                if (fullTitle) {
                    name = fullTitle.includes(' - ')
                        ? fullTitle.split(' - ')[0]
                        : fullTitle;
                }
            }
            if (name) vod.vod_name = name;
            let cover = $('meta[property="og:image"]').attr('content') || '';
            if (cover) {
                cover = cover.trim();
                cover = resolveUrl(cover);
                vod.vod_pic = cover;
            }
            let desc = $('meta[name="description"]').attr('content') || '';
            if (!desc) {
                const jsonldText = $('script[type="application/ld+json"]').first().text();
                if (jsonldText) {
                    try {
                        const jsonldData = JSON.parse(jsonldText);
                        if (Array.isArray(jsonldData)) {
                            for (const item of jsonldData) {
                                if (item && typeof item === 'object' && item.description) {
                                    desc = item.description;
                                    break;
                                }
                            }
                        } else if (jsonldData && jsonldData.description) {
                            desc = jsonldData.description;
                        }
                    } catch (err) {}
                }
            }
            if (desc) {
                vod.vod_content = desc.trim();
            }
            vod.vod_play_from = '瑟佬在线';
            vod.vod_play_url = `开撸$${url}`;
        } catch (e) {
            console.error('detail error:', e);
        }
        videos.push(vod);
    }
    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const url = id && id.startsWith('http') ? id : resolveUrl(id || '/');
    let playUrl = url;
    let parse = 1;
    try {
        const html = await requestPage(url, { Referer: url });
        const videoRegex =
            /const\s+player\s*=\s*new\s+VideoPlayer\([\s\S]*?src:\s*["']([^"']+?)["']/;
        const m = videoRegex.exec(html);
        if (m) {
            const videoUrl = m[1];
            if (/\.(m3u8|mp4|ts)/.test(videoUrl)) {
                playUrl = videoUrl;
                parse = 0;
            }
        }
    } catch (e) {
        console.error('play 解析错误:', e);
    }
    return JSON.stringify({
        parse,
        url: playUrl,
        header: {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
            Referer: url,
        },
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd || '';
    let pg = parseInt(inReq.body.page || 1, 10);
    const searchUrl =
        pg > 1
            ? `${HOST}/search?q=${encodeURIComponent(wd)}&page=${pg}`
            : `${HOST}/search?q=${encodeURIComponent(wd)}`;
    const result = {
        list: [],
    };
    try {
        const html = await requestPage(searchUrl);
        const vods = extractVideoItems(html);
        result.list = vods;
    } catch (e) {
        console.error('search error:', e);
    }
    return result;
}

async function test(inReq, outResp) {
    try {
        const printErr = function (json) {
            if (json && json.statusCode && json.statusCode === 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr('' + resp.json());
        if (dataResult.home.class && dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list && dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id,
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                if (dataResult.detail.list && dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    for (const vod of dataResult.detail.list) {
                        const flags = vod.vod_play_from.split('$$$');
                        const ids = vod.vod_play_url.split('$$$');
                        for (let j = 0; j < flags.length; j++) {
                            const flag = flags[j];
                            const urls = ids[j].split('#');
                            for (let i = 0; i < urls.length && i < 2; i++) {
                                const playId = urls[i].split('$')[1];
                                const pResp = await inReq.server
                                    .inject()
                                    .post(`${prefix}/play`)
                                    .payload({
                                        flag: flag,
                                        id: playId,
                                    });
                                dataResult.play.push(pResp.json());
                            }
                        }
                    }
                }
            }
        }
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '麻豆',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'xchina001',
        name: '影视 ┃ 🈲小黄书',
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
        fastify.get('/test', test);
    },
};
