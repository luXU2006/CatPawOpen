import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';
import { URL } from 'url';

let HOST = 'https://zh.xhamster1.desi';
const BASE_HOST = 'https://xhamster.com';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'dnt': '1',
    'upgrade-insecure-requests': '1',
    'sec-fetch-site': 'none',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    'sec-fetch-dest': 'document',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

function e64(text) {
    return Buffer.from(text).toString('base64');
}

function d64(encoded) {
    return Buffer.from(encoded, 'base64').toString('utf-8');
}

async function request(reqUrl, opts = {}) {
    const h = { ...HEADERS, 'referer': `${HOST}/`, ...opts.headers };
    let res = await req(reqUrl, {
        method: opts.method || 'get',
        headers: h,
        data: opts.data,
    });
    return res;
}

async function init(inReq, outResp) {
    try {
        let res = await req(BASE_HOST, {
            method: 'head',
            headers: HEADERS,
            validateStatus: (status) => status >= 200 && status < 400,
        });
        
        if (res.request && res.request.res && res.request.res.responseUrl) {
            let finalUrl = res.request.res.responseUrl;
            if (finalUrl.endsWith('/')) finalUrl = finalUrl.slice(0, -1);
            HOST = finalUrl;
        } else if (res.headers['location']) {
            HOST = res.headers['location'];
            if (HOST.endsWith('/')) HOST = HOST.slice(0, -1);
        }
        console.log(`Xhamster initialized with host: ${HOST}`);
    } catch (e) {
        console.log(`Init failed, using default host: ${HOST}`);
    }
    return {};
}

async function home(inReq, outResp) {
    const cateManual = {
        "4K": "/4k",
        "国产": "two_click_/categories/chinese",
        "最新": "/newest",
        "最佳": "/best",
        "频道": "/channels",
        "类别": "/categories",
        "明星": "/pornstars"
    };
    
    let classes = [];
    let filterObj = {};
    
    for (const k in cateManual) {
        const v = cateManual[k];
        classes.push({
            'type_name': k,
            'type_id': v
        });
        
        if (k !== '4K') {
            filterObj[v] = [{'key':'type','name':'类型','value':[{'n':'4K','v':'/4k'}]}];
        }
    }

    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

function getJsData(html) {
    try {
        const $ = load(html);
        const scriptContent = $("script[id='initials-script']").text();
        if (scriptContent.includes('initials=')) {
            const jsonStr = scriptContent.split('initials=')[1].slice(0, -1);
            return JSON.parse(jsonStr);
        }
    } catch (e) {
        console.error('Parse JS data failed', e);
    }
    return {};
}

function getList($) {
    let videos = [];
    $(".thumb-list--sidebar .thumb-list__item").each((i, el) => {
        const item = $(el);
        const linkEl = item.find('.role-pop');
        const href = linkEl.attr('href');
        if (!href) return;
        
        const title = item.find('.video-thumb-info a').text().trim();
        const pic = linkEl.find('img').attr('src');
        const views = item.find('.video-thumb-info .video-thumb-views').text().split(' ')[0];
        const duration = linkEl.find('div[data-role="video-duration"]').text().trim();

        videos.push({
            vod_id: href,
            vod_name: title,
            vod_pic: pic,
            vod_year: views,
            vod_remarks: duration,
            style: {'ratio': 1.33, 'type': 'rect'}
        });
    });
    return videos;
}

async function homeVod() {
    try {
        const res = await request(HOST);
        const $ = load(res.data);
        return JSON.stringify({
            list: getList($)
        });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function category(inReq, _outResp) {
    let tid = inReq.body.id;
    let pg = inReq.body.page || 1;
    const extend = inReq.body.filters || {};
    
    let vdata = [];
    
    try {
        if (['/4k', '/newest', '/best'].includes(tid) || tid.includes('two_click_')) {
            if (tid.includes('two_click_')) tid = tid.split('click_')[1];
            
            const type = extend.type || '';
            const url = `${HOST}${tid}${type}/${pg}`;
            
            const res = await request(url);
            const $ = load(res.data);
            vdata = getList($);
            
        } else if (tid === '/channels') {
            const url = `${HOST}${tid}/${pg}`;
            const res = await request(url);
            const jsdata = getJsData(res.data);
            
            if (jsdata && jsdata.channels) {
                for (const i of jsdata.channels) {
                    vdata.push({
                        vod_id: "two_click_" + i.channelURL,
                        vod_name: i.channelName,
                        vod_pic: i.siteLogoURL,
                        vod_year: `videos:${i.videoCount}`,
                        vod_tag: 'folder',
                        vod_remarks: `subscribers:${i.subscriptionModel?.subscribers || 0}`,
                        style: {'ratio': 1.33, 'type': 'rect'}
                    });
                }
            }
        } else if (tid === '/categories') {
            const url = `${HOST}${tid}`;
            const res = await request(url);
            const cdata = getJsData(res.data);
            
            if (cdata && cdata.layoutPage?.store?.popular?.assignable) {
                for (const i of cdata.layoutPage.store.popular.assignable) {
                    vdata.push({
                        vod_id: "one_click_" + i.id,
                        vod_name: i.name,
                        vod_pic: '',
                        vod_tag: 'folder',
                        style: {'ratio': 1.33, 'type': 'rect'}
                    });
                }
            }
        } else if (tid === '/pornstars') {
            const url = `${HOST}${tid}/${pg}`;
            const res = await request(url);
            const pdata = getJsData(res.data);
            
            if (pdata && pdata.pagesPornstarsComponent?.pornstarListProps?.pornstars) {
                for (const i of pdata.pagesPornstarsComponent.pornstarListProps.pornstars) {
                    vdata.push({
                        vod_id: "two_click_" + i.pageURL,
                        vod_name: i.name,
                        vod_pic: i.imageThumbUrl,
                        vod_remarks: i.translatedCountryName,
                        vod_tag: 'folder',
                        style: {'ratio': 1.33, 'type': 'rect'}
                    });
                }
            }
        } else if (tid.includes('one_click_')) {
            const targetId = tid.split('click_')[1];
            const url = `${HOST}/categories`;
            const res = await request(url);
            const cdata = getJsData(res.data);
            
            if (cdata && cdata.layoutPage?.store?.popular?.assignable) {
                for (const i of cdata.layoutPage.store.popular.assignable) {
                    if (String(i.id) === String(targetId)) {
                        for (const j of i.items) {
                            vdata.push({
                                vod_id: "two_click_" + j.url,
                                vod_name: j.name,
                                vod_pic: j.thumb,
                                vod_tag: 'folder',
                                style: {'ratio': 1.33, 'type': 'rect'}
                            });
                        }
                        break;
                    }
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    return JSON.stringify({
        page: parseInt(pg),
        pagecount: 9999,
        limit: 90,
        total: 999999,
        list: vdata,
    });
}

async function parseHlsQualities(m3u8Url) {
    try {
        const res = await request(m3u8Url);
        const content = res.data;
        
        const qualities = {};
        const regex = /#EXT-X-STREAM-INF:.*?RESOLUTION=([\d]+x[\d]+).*?\n([^\n]+)/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            const resolution = match[1];
            const path = match[2].trim();
            const height = resolution.split('x')[1];
            const quality = `${height}p`;
            
            let fullUrl = path;
            if (!path.startsWith('http')) {
                fullUrl = new URL(path, m3u8Url).toString();
            }
            
            qualities[quality] = fullUrl;
        }
        
        if (Object.keys(qualities).length > 0) {
            const sortedKeys = Object.keys(qualities).sort((a, b) => {
                const hA = parseInt(a.replace('p', '')) || 0;
                const hB = parseInt(b.replace('p', '')) || 0;
                return hB - hA;
            });
            
            const sortedQualities = {};
            sortedKeys.forEach(k => sortedQualities[k] = qualities[k]);
            return sortedQualities;
        }
        return null;
    } catch (e) {
        console.error('Parse HLS failed:', e.message);
        return null;
    }
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        let url = id;
        if (!url.startsWith('http')) url = HOST + url;

        try {
            const res = await request(url);
            const html = res.data;
            const $ = load(html);
            
            const vn = $('meta[property="og:title"]').attr('content');
            
            const tagsContainer = $('#video-tags-list-container');
            const href = tagsContainer.find('a').attr('href');
            const titleText = tagsContainer.find('span[class*="body-bold-"]').eq(0).text();
            
            let vod_director = '';
            if (href) {
                const target = JSON.stringify({id: 'two_click_' + href, name: titleText});
                vod_director = `[a=cr:${target}/]${titleText}[/a]`;
            }
            
            const vod_remarks = $('.rb-new__info').text().trim();
            
            let plist = [];
            const hlsUrls = new Set();
            
            const patterns = [
                /setVideoHLS\(["']([^"']+\.m3u8)["']\)/g,
                /"hlsUrl"\s*:\s*["']([^"']+\.m3u8)["']/g,
                /hls\s*:\s*[{\s]*url\s*:\s*["']([^"']+\.m3u8)["']/g,
                /["'](https?:\/\/[^"']+\.m3u8)["']/g
            ];
            
            for (const p of patterns) {
                let m;
                while ((m = p.exec(html)) !== null) {
                    hlsUrls.add(m[1]);
                }
            }
            
            if (hlsUrls.size > 0) {
                for (const hlsUrl of hlsUrls) {
                    const qualities = await parseHlsQualities(hlsUrl);
                    
                    if (qualities) {
                        for (const [quality, qUrl] of Object.entries(qualities)) {
                            const encoded = e64(`0@@@@${qUrl}`);
                            plist.push(`${quality}$${encoded}`);
                        }
                    } else {
                        const encoded = e64(`0@@@@${hlsUrl}`);
                        plist.push(`HLS$${encoded}`);
                    }
                }
            } else {
                const encoded = e64(`1@@@@${url}`);
                plist.push(`${vn}$${encoded}`);
            }

            plist.sort((a, b) => {
                const getNum = (s) => {
                    const m = s.split('$')[0].match(/\d+/);
                    return m ? parseInt(m[0]) : 0;
                };
                return getNum(b) - getNum(a);
            });

            videos.push({
                vod_id: id,
                vod_name: vn,
                vod_director: vod_director,
                vod_remarks: vod_remarks,
                vod_play_from: 'Xhamster',
                vod_play_url: plist.join('#')
            });

        } catch (e) {
            console.error('Detail fetch failed:', e);
        }
    }

    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const decoded = d64(id);
    const parts = decoded.split('@@@@');
    
    const parse = parseInt(parts[0]);
    const url = parts[1];
    
    return JSON.stringify({
        parse: parse,
        url: url,
        header: {
            'User-Agent': HEADERS['User-Agent'],
            'Referer': `${HOST}/`,
            'Origin': HOST,
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'sec-fetch-dest': 'empty',
        }
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    const pg = inReq.body.page || 1;
    
    const url = `${HOST}/search/${encodeURIComponent(wd)}?page=${pg}`;
    
    try {
        const res = await request(url);
        const $ = load(res.data);
        return JSON.stringify({
            list: getList($),
            page: parseInt(pg),
        });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function test(inReq, outResp) {
    try {
        const printErr = function (json) {
            if (json.statusCode && json.statusCode == 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        
        await inReq.server.inject().post(`${prefix}/init`);
        
        let resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr("" + resp.json());
        
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id,
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                
                if (dataResult.detail.list && dataResult.detail.list.length > 0) {
                    const vod = dataResult.detail.list[0];
                    const flags = vod.vod_play_from.split('$$$');
                    const ids = vod.vod_play_url.split('$$$');
                    
                    dataResult.play = [];
                    for (let j = 0; j < flags.length; j++) {
                        const flag = flags[j];
                        const urls = ids[j].split('#');
                        for (let i = 0; i < urls.length && i < 1; i++) {
                            resp = await inReq.server
                                .inject()
                                .post(`${prefix}/play`)
                                .payload({
                                    flag: flag,
                                    id: urls[i].split('$')[1],
                                });
                            dataResult.play.push(resp.json());
                        }
                    }
                }
            }
        }
        
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: 'asian',
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
        key: 'xhamster',
        name: '影视 ┃ 🈲Xhamster',
        type: 3,
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