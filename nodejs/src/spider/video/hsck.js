import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';

let HOST = 'http://6747ck.cc'; 
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

async function request(reqUrl, config = {}) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': UA,
            'Referer': HOST + '/'
        },
        ...config
    });
    return res;
}

function getFullUrl(url) {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    return `${HOST.replace(/\/+$/, '')}${url}`;
}

function parseList($) {
    const videos = [];
    const items = $('.stui-vodlist li');
    
    items.each((_, item) => {
        const $item = $(item);
        const a = $item.find('a');
        const vid = a.attr('href');
        
        if (!vid || !vid.startsWith('/vodplay/')) return;

        const name = $item.find('h4').text().trim();
        const img = a.attr('data-original');
        const remark = $item.find('.pic-text').text().trim();

        if (!name || !img) return;

        videos.push({
            vod_id: vid,
            vod_name: name,
            vod_pic: getFullUrl(img),
            vod_remarks: remark
        });
    });
    return videos;
}

async function getDynamicHost() {
    try {
        const initialHost = Buffer.from('aHR0cDovL2hzY2submV0', 'base64').toString('utf-8');
        
        const res = await request(initialHost);
        const html = res.data;
        
        const strUMatch = html.match(/strU="(.*?)"/);
        if (!strUMatch) return initialHost;
        
        const strU = strUMatch[1];
        const locationU = strU + initialHost.replace(/\/$/, '') + '/&p=/';
        
        const redirectRes = await request(locationU, { 
            maxRedirects: 0, 
            validateStatus: (status) => status >= 200 && status < 400 
        });
        
        if (redirectRes.headers['location']) {
            return redirectRes.headers['location'];
        } else if (redirectRes.data && redirectRes.data.location) {
            return redirectRes.data.location;
        }
        
        return initialHost;
    } catch (e) {
        console.error(`获取动态主机失败: ${e.message}`);
        return HOST;
    }
}

async function init(inReq, outResp) {
    const newHost = await getDynamicHost();
    if (newHost) {
        HOST = newHost.replace(/\/$/, '');
        console.log(`动态获取HOST成功: ${HOST}`);
    }
    return {};
}

async function home(inReq, outResp) {
    const classes = [
        {"type_name": "日韩AV", "type_id": "1"},
        {"type_name": "国产系列", "type_id": "2"}, 
        {"type_name": "欧美", "type_id": "3"},
        {"type_name": "成人动漫", "type_id": "4"},
        {"type_name": "日本有码", "type_id": "7"},
        {"type_name": "一本道高清无码", "type_id": "8"},
        {"type_name": "有码中文字幕", "type_id": "9"},
        {"type_name": "日本无码", "type_id": "10"},
        {"type_name": "国产视频", "type_id": "15"},
        {"type_name": "欧美高清", "type_id": "21"},
        {"type_name": "动漫剧情", "type_id": "22"}
    ];
    return JSON.stringify({
        class: classes,
        filters: {}
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    
    const url = `${HOST}/vodtype/${tid}-${pg}.html`;
    const res = await request(url);
    const $ = load(res.data);
    
    const videos = parseList($);
    
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: videos.length > 0 ? parseInt(pg) + 1 : parseInt(pg),
        limit: videos.length,
        total: 99999,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const url = getFullUrl(id);
    
    try {
        const res = await request(url);
        const html = res.data;
        const $ = load(html);
        
        let title = $('.stui-pannel__head .title').text().trim();
        if (!title) {
            title = $('title').text().split(' - ')[0].trim();
        }
        
        let pic = $('.stui-vodlist__thumb').attr('data-original') || $('.stui-vodlist__thumb').attr('src') || $('img').attr('src');
        
        const scriptText = $('script').text();
        let m3u8Url = "";
        
        const playerPattern = /player_aaaa\s*=\s*({.*?});/s;
        const playerMatch = scriptText.match(playerPattern);
        
        if (playerMatch) {
            try {
                let jsonStr = playerMatch[1].replace(/\\\//g, '/');
                const playerData = JSON.parse(jsonStr);
                if (playerData.url && playerData.url.includes('.m3u8')) {
                    m3u8Url = playerData.url;
                }
            } catch (e) {
            }
        }
        
        if (!m3u8Url) {
            const m3u8Patterns = [
                /"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/,
                /url\s*:\s*"([^"]+\.m3u8[^"]*)"/,
                /https?:\/\/[^\s"']+\.m3u8[^\s"']*/
            ];
            
            for (const pattern of m3u8Patterns) {
                const match = scriptText.match(pattern);
                if (match) {
                    m3u8Url = match[1] || match[0];
                    break;
                }
            }
        }
        
        if (!m3u8Url) {
            const iframeSrc = $('iframe').attr('src');
            if (iframeSrc && iframeSrc.includes('m3u8')) {
                m3u8Url = iframeSrc;
            }
        }
        
        if (m3u8Url) {
            m3u8Url = m3u8Url.replace(/\\\//g, '/');
            m3u8Url = getFullUrl(m3u8Url);
        }

        let playUrlStr = "";
        if (m3u8Url) {
            playUrlStr = `线路1$${m3u8Url}`;
        } else {
            playUrlStr = `详情页线路$${url}`;
        }
        
        return {
            list: [{
                vod_id: id,
                vod_name: title,
                vod_pic: getFullUrl(pic),
                vod_content: title,
                vod_play_from: "黄色仓库",
                vod_play_url: playUrlStr
            }],
        };
    } catch (e) {
        console.error(`详情页解析失败: ${e.message}`);
        return { list: [] };
    }
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return JSON.stringify({
        parse: 0,
        url: id,
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    const searchUrl = `${HOST}/vodsearch/-------------.html?wd=${encodeURIComponent(wd)}`;
    
    try {
        const res = await request(searchUrl);
        const $ = load(res.data);
        const videos = parseList($);
        
        return JSON.stringify({
            list: videos,
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
        
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        
        resp = await inReq.server.inject().post(`${prefix}/home`);
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
                    const playUrl = vod.vod_play_url.split('$')[1];
                    console.log(`测试播放链接: ${playUrl}`);
                    resp = await inReq.server.inject().post(`${prefix}/play`).payload({
                        id: playUrl,
                    });
                    dataResult.play = resp.json();
                }
            }
        }
        
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '国产',
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
        key: 'hsck',
        name: '🟡 黄色仓库',
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