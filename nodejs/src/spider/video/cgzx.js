import req from '../../util/req.js';
import { load } from 'cheerio';
import crypto from 'crypto';
import pkg from 'lodash';
const { _ } = pkg;

let HOST = 'https://but.vncchqw.cc';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IMG_CACHE = {};

let LOCAL_SERVER_URL = '';

const HEADERS = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
};

async function request(url, options = {}) {
    const headers = { ...HEADERS, 'Origin': HOST, 'Referer': HOST + '/' };
    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    
    const opt = {
        method: options.method || 'get',
        headers: headers,
        data: options.data,
        responseType: options.responseType || 'text',
    };

    return await req(url, opt);
}

function aesImgDecrypt(dataBuffer) {
    if (!Buffer.isBuffer(dataBuffer) || dataBuffer.length < 16) return dataBuffer;

    const keys = [
        { key: Buffer.from('f5d965df75336270'), iv: Buffer.from('97b60394abc2fbe1') },
        { key: Buffer.from('75336270f5d965df'), iv: Buffer.from('abc2fbe197b60394') }
    ];

    for (const k of keys) {
        try {
            const decipher = crypto.createDecipheriv('aes-128-cbc', k.key, k.iv);
            decipher.setAutoPadding(true);
            let dec = Buffer.concat([decipher.update(dataBuffer), decipher.final()]);
            if (dec.slice(0, 2).equals(Buffer.from([0xff, 0xd8])) || dec.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
                return dec;
            }
        } catch (e) {}

        try {
            const decipher = crypto.createDecipheriv('aes-128-ecb', k.key, null);
            decipher.setAutoPadding(true);
            let dec = Buffer.concat([decipher.update(dataBuffer), decipher.final()]);
            if (dec.slice(0, 2).equals(Buffer.from([0xff, 0xd8]))) {
                return dec;
            }
        } catch (e) {}
    }
    return dataBuffer;
}

function e64(text) {
    return Buffer.from(String(text)).toString('base64');
}

function d64(text) {
    return Buffer.from(String(text), 'base64').toString('utf-8');
}

function updateLocalUrl(inReq) {
    if (inReq.headers && inReq.headers.host) {
        LOCAL_SERVER_URL = `http://${inReq.headers.host}`;
    } else if (inReq.server && inReq.server.address) {
        const addr = inReq.server.address();
        let ip = addr.address;
        if (ip === '::' || ip === '0.0.0.0') ip = '127.0.0.1';
        LOCAL_SERVER_URL = `http://${ip}:${addr.port}`;
    }
    if (inReq.server && inReq.server.prefix) {
        LOCAL_SERVER_URL += inReq.server.prefix;
    }
}

function getProxyUrl(params) {
    if (!LOCAL_SERVER_URL) return '';
    const query = new URLSearchParams(params).toString();
    return `${LOCAL_SERVER_URL}/proxy?${query}`;
}

function procUrl(url) {
    if (!url) return '';
    url = url.replace(/['" ]/g, '');
    
    if (url.startsWith('data:')) {
        try {
            const [meta, b64Str] = url.split(',', 2);
            let raw = Buffer.from(b64Str, 'base64');
            if (!(raw.slice(0, 2).equals(Buffer.from([0xff, 0xd8])) || 
                  raw.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) || 
                  raw.slice(0, 4).equals(Buffer.from('GIF8')))) {
                raw = aesImgDecrypt(raw);
            }
            const key = crypto.createHash('md5').update(raw).digest('hex');
            IMG_CACHE[key] = raw;
            return getProxyUrl({ type: 'cache', key: key });
        } catch (e) {
            return "";
        }
    }

    if (!url.startsWith('http')) {
        url = url.startsWith('/') ? HOST + url : HOST + '/' + url;
    }
    return getProxyUrl({ url: e64(url), type: 'img' });
}

function getImgFromHtml(text, elemStr) {
    const bannerMatch = text.match(/loadBannerDirect\('([^']+)'/);
    if (bannerMatch) return procUrl(bannerMatch[1]);

    if (!elemStr) return '';
    
    elemStr = elemStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

    const dataMatch = elemStr.match(/(data:image\/[a-zA-Z0-9+/=;,]+)/);
    if (dataMatch) return procUrl(dataMatch[1]);

    const urlMatch = elemStr.match(/(https?:\/\/[^"'\s)]+\.(?:jpg|png|jpeg|webp))/i);
    if (urlMatch) return procUrl(urlMatch[1]);

    const cssMatch = elemStr.match(/url\s*\(\s*['"]?([^"'\)]+)['"]?\s*\)/i);
    if (cssMatch) return procUrl(cssMatch[1]);

    return '';
}

function getList($, selector, tid = '') {
    const videos = [];
    const isFolder = tid.includes('/mrdg');
    
    $(selector).each((_, el) => {
        const $el = $(el);
        let $a = $el.is('a') ? $el : $el.find('a').first();
        const href = $a.attr('href');
        let title = $el.find('h2').text() || $el.find('.entry-title').text() || $el.find('.post-title').text();
        if (!title && $el.is('a')) title = $el.text();

        if (href && title) {
            const scriptText = $el.find('script').text();
            const htmlContent = $el.prop('outerHTML') || '';
            const img = getImgFromHtml(scriptText, htmlContent);

            videos.push({
                vod_id: href + (isFolder ? '@folder' : ''),
                vod_name: title.trim(),
                vod_pic: img,
                vod_remarks: $el.find('time').text() || '',
                vod_tag: isFolder ? 'folder' : '',
                style: { type: "rect", ratio: 1.33 }
            });
        }
    });
    return videos;
}

async function getWorkingHost() {
    const dynamicUrls = ['https://but.vncchqw.cc/'];
    for (const url of dynamicUrls) {
        try {
            await request(url, { method: 'head', timeout: 5000 });
            return url.replace(/\/$/, '');
        } catch (e) {
            continue;
        }
    }
    return dynamicUrls[0].replace(/\/$/, '');
}

async function init(inReq, outResp) {
    try {
        updateLocalUrl(inReq);
    } catch (e) {}
    
    HOST = await getWorkingHost();
    console.log(`使用站点: ${HOST}`);
    return {};
}

async function home(inReq, outResp) {
    updateLocalUrl(inReq);
    try {
        const res = await request(HOST);
        const $ = load(res.data);
        
        let classes = [];
        const selectors = ['.category-list ul li', '.nav-menu li', '.menu li', 'nav ul li'];
        
        for (const sel of selectors) {
            $(sel).each((_, el) => {
                const $a = $(el).find('a');
                const href = ($a.attr('href') || '').trim();
                const name = ($a.text() || '').trim();
                if (href && href !== '#' && name) {
                    classes.push({ type_name: name, type_id: href });
                }
            });
            if (classes.length > 0) break;
        }

        if (classes.length === 0) {
            classes = [
                { type_name: '最新', type_id: '/latest/' },
                { type_name: '热门', type_id: '/hot/' }
            ];
        }

        const list = getList($, '#index article, article');
        return JSON.stringify({ class: classes, list: list });
    } catch (e) {
        console.error(e);
        return JSON.stringify({ class: [], list: [] });
    }
}

async function category(inReq, outResp) {
    updateLocalUrl(inReq);
    const tid = inReq.body.id;
    let pg = inReq.body.page || 1;
    
    if (tid.includes('@folder')) {
        const realId = tid.replace('@folder', '');
        const url = `${HOST}${realId}`;
        try {
            const res = await request(url);
            const $ = load(res.data);
            const videos = [];
            
            $('.post-content h2').each((i, h2) => {
                const $pTxt = $('.post-content p').eq(i * 2);
                const $pImg = $('.post-content p').eq(i * 2 + 1);
                const pImgHtml = $pImg.prop('outerHTML');
                
                videos.push({
                    vod_id: $pTxt.find('a').attr('href'),
                    vod_name: $pTxt.text().trim(),
                    vod_pic: getImgFromHtml('', pImgHtml),
                    vod_remarks: $(h2).text().trim()
                });
            });
            
            return JSON.stringify({
                list: videos,
                page: 1,
                pagecount: 1,
                limit: 90,
                total: videos.length
            });
        } catch (e) {
            return JSON.stringify({ list: [] });
        }
    }

    let baseUrl = '';
    if (tid.startsWith('http')) {
        baseUrl = tid.replace(/\/$/, '');
    } else {
        const path = tid.startsWith('/') ? tid : '/' + tid;
        baseUrl = `${HOST}${path}`.replace(/\/$/, '');
    }
    
    const url = pg == 1 ? `${baseUrl}/` : `${baseUrl}/${pg}/`;
    
    try {
        const res = await request(url);
        const $ = load(res.data);
        const videos = getList($, '#archive article, #index article, article', tid);
        
        return JSON.stringify({
            list: videos,
            page: parseInt(pg),
            pagecount: 9999,
            limit: 90,
            total: 999999
        });
    } catch (e) {
        return JSON.stringify({ list: [], page: parseInt(pg) });
    }
}

async function detail(inReq, outResp) {
    updateLocalUrl(inReq);
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const list = [];
    
    for (const id of ids) {
        const url = id.startsWith('http') ? id : `${HOST}${id}`;
        try {
            const res = await request(url);
            const $ = load(res.data);
            
            let playList = [];
            let usedNames = new Set();
            
            $('.dplayer').each((i, el) => {
                const configAttr = $(el).attr('data-config');
                if (configAttr) {
                    try {
                        const config = JSON.parse(configAttr);
                        const videoUrl = config.video && config.video.url;
                        if (videoUrl) {
                            let epName = '';
                            let $parent = $(el).parent();
                            for (let k = 0; k < 4; k++) {
                                if ($parent.length === 0) break;
                                const heading = $parent.find('h2, h3, h4').first().text().trim();
                                if (heading) {
                                    epName = heading;
                                    break;
                                }
                                $parent = $parent.parent();
                            }
                            
                            let baseName = epName || `视频${i + 1}`;
                            let name = baseName;
                            let count = 2;
                            while (usedNames.has(name)) {
                                name = `${baseName} ${count}`;
                                count++;
                            }
                            usedNames.add(name);
                            playList.push(`${name}$${videoUrl}`);
                        }
                    } catch (e) {}
                }
            });

            if (playList.length === 0) {
                const $content = $('.post-content, article');
                let linkCount = 1;
                $content.find('a').each((_, el) => {
                    const linkText = $(el).text().trim();
                    let linkHref = $(el).attr('href');
                    const keywords = ['点击观看', '观看', '播放', '视频', '第一弹', '第二弹', '第三弹', '第四弹', '第五弹', '第六弹', '第七弹', '第八弹', '第九弹', '第十弹'];
                    
                    if (linkHref && keywords.some(kw => linkText.includes(kw))) {
                        let epName = linkText.replace('点击观看：', '').replace('点击观看', '').trim();
                        if (!epName) epName = `视频${linkCount}`;
                        linkCount++;
                        
                        if (!linkHref.startsWith('http')) {
                            linkHref = linkHref.startsWith('/') ? `${HOST}${linkHref}` : `${HOST}/${linkHref}`;
                        }
                        playList.push(`${epName}$${linkHref}`);
                    }
                });
            }
            
            const playUrl = playList.length > 0 ? playList.join('#') : `未找到视频源$${url}`;
            
            let vodContent = '';
            try {
                const tags = [];
                const seenTagNames = new Set();
                const seenTagIds = new Set();
                
                const candidates = [];
                $('.tags a, .keywords a, .post-tags a').each((_, el) => {
                    const name = $(el).text().trim();
                    const href = $(el).attr('href');
                    if (name && href) {
                        candidates.push({ name, id: href });
                    }
                });
                
                candidates.sort((a, b) => b.name.length - a.name.length);
                
                for (const item of candidates) {
                    if (seenTagIds.has(item.id)) continue;
                    
                    let isDuplicate = false;
                    for (const seen of seenTagNames) {
                        if (seen.includes(item.name)) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    
                    if (!isDuplicate) {
                        const target = JSON.stringify({ id: item.id, name: item.name });
                        tags.push(`[a=cr:${target}/]${item.name}[/a]`);
                        seenTagNames.add(item.name);
                        seenTagIds.add(item.id);
                    }
                }
                
                if (tags.length > 0) {
                    vodContent = tags.join(' ');
                } else {
                    vodContent = $('.post-title').text();
                }
            } catch (e) {
                vodContent = '获取标签失败';
            }
            
            if (!vodContent) vodContent = $('h1').text() || '91吃瓜中心';
            
            list.push({
                vod_play_from: '91吃瓜中心',
                vod_play_url: playUrl,
                vod_content: vodContent
            });
            
        } catch (e) {
            list.push({
                vod_play_from: '91吃瓜中心',
                vod_play_url: '获取失败',
                vod_content: ''
            });
        }
    }
    return { list: list };
}

async function search(inReq, outResp) {
    updateLocalUrl(inReq);
    const key = inReq.body.wd;
    let pg = inReq.body.page || 1;
    
    const url = pg == 1 ? `${HOST}/search/${key}/` : `${HOST}/search/${key}/${pg}/`;
    
    try {
        const res = await request(url);
        const $ = load(res.data);
        const videos = getList($, 'article');
        return JSON.stringify({
            list: videos,
            page: parseInt(pg),
            pagecount: 9999
        });
    } catch (e) {
        return JSON.stringify({ list: [], page: parseInt(pg) });
    }
}

async function play(inReq, outResp) {
    updateLocalUrl(inReq);
    const id = inReq.body.id;
    const isVideo = ['.m3u8', '.mp4', '.ts'].some(ext => id.includes(ext));
    const parse = isVideo ? 0 : 1;
    
    let url = id;
    if (id.includes('.m3u8')) {
        url = getProxyUrl({ url: e64(id), type: 'm3u8' });
    }
    
    return JSON.stringify({
        parse: parse,
        url: url,
        header: HEADERS
    });
}

async function proxy(inReq, outResp) {
    const query = inReq.query;
    const type = query.type;
    
    try {
        if (type === 'cache') {
            const key = query.key;
            const content = IMG_CACHE[key];
            if (content) {
                outResp.header('Content-Type', 'image/jpeg');
                return content;
            }
            outResp.code(404);
            return 'Expired';
        } 
        else if (type === 'img') {
            let url = query.url;
            if (url) url = d64(url);
            if (!url.startsWith('http')) url = HOST + url;
            
            const res = await request(url, { responseType: 'arraybuffer' });
            const decrypted = aesImgDecrypt(res.data);
            
            outResp.header('Content-Type', 'image/jpeg');
            return decrypted;
        } 
        else if (type === 'm3u8') {
            let url = query.url;
            if (url) url = d64(url);
            
            const res = await request(url);
            const data = res.data;
            const base = url.substring(0, url.lastIndexOf('/'));
            
            const lines = data.split('\n').map(line => {
                line = line.trim();
                if (!line) return line;
                if (line.startsWith('#')) return line;
                
                let tsUrl = line;
                if (!line.startsWith('http')) {
                    tsUrl = base + '/' + line;
                }
                return getProxyUrl({ url: e64(tsUrl), type: 'ts' });
            });
            
            outResp.header('Content-Type', 'application/vnd.apple.mpegurl');
            return lines.join('\n');
        } 
        else if (type === 'ts') {
            let url = query.url;
            if (url) url = d64(url);
            
            const res = await request(url, { responseType: 'arraybuffer' });
            outResp.header('Content-Type', 'video/mp2t');
            return res.data;
        }
    } catch (e) {
        outResp.code(500);
        return '';
    }
    return '';
}

async function test(inReq, outResp) {
    try {
        const prefix = inReq.server.prefix;
        const dataResult = {};
        
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        
        if (dataResult.home.list.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                id: dataResult.home.list[0].vod_id,
            });
            dataResult.detail = resp.json();
        }
        
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message };
    }
}

export default {
    meta: {
        key: 'cgzx',
        name: '影视 ┃ 🈲91吃瓜中心',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy', proxy);
        fastify.get('/test', test);
    },
};