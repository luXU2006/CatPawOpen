import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';

let HOST = 'https://www.ylys.tv';
let siteKey = '';
let siteType = 0;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || UA,
            'Referer': HOST
        },
    });
    return res.data;
}

function fixUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return HOST + (url.startsWith('/') ? url : '/' + url);
}

async function init(inReq, outResp) {
    return {};
}

async function home(inReq, outResp) {
    let classes = [
        { "type_id": "1", "type_name": "电影" },
        { "type_id": "2", "type_name": "剧集" },
        { "type_id": "3", "type_name": "综艺" },
        { "type_id": "4", "type_name": "动漫" }
    ];
    let filterObj = {
        "1": [
            { "key": "class", "name": "类型", "value": [{ "n": "全部", "v": "1" }, { "n": "动作片", "v": "6" }, { "n": "喜剧片", "v": "7" }, { "n": "爱情片", "v": "8" }, { "n": "科幻片", "v": "9" }, { "n": "恐怖片", "v": "11" }] },
            { "key": "year", "name": "年份", "value": [{ "n": "全部", "v": "" }].concat(Array.from({ length: 15 }, (_, i) => ({ "n": `${2025 - i}`, "v": `${2025 - i}` }))) }
        ],
        "2": [
            { "key": "class", "name": "类型", "value": [{ "n": "全部", "v": "2" }, { "n": "国产剧", "v": "13" }, { "n": "港台剧", "v": "14" }, { "n": "日剧", "v": "15" }, { "n": "韩剧", "v": "33" }, { "n": "欧美剧", "v": "16" }] },
            { "key": "year", "name": "年份", "value": [{ "n": "全部", "v": "" }].concat(Array.from({ length: 15 }, (_, i) => ({ "n": `${2025 - i}`, "v": `${2025 - i}` }))) }
        ],
        "3": [
            { "key": "class", "name": "类型", "value": [{ "n": "全部", "v": "3" }, { "n": "内地综艺", "v": "27" }, { "n": "港台综艺", "v": "28" }, { "n": "日本综艺", "v": "29" }, { "n": "韩国综艺", "v": "36" }] },
            { "key": "year", "name": "年份", "value": [{ "n": "全部", "v": "" }].concat(Array.from({ length: 15 }, (_, i) => ({ "n": `${2025 - i}`, "v": `${2025 - i}` }))) }
        ],
        "4": [
            { "key": "class", "name": "类型", "value": [{ "n": "全部", "v": "4" }, { "n": "国产动漫", "v": "31" }, { "n": "日本动漫", "v": "32" }, { "n": "欧美动漫", "v": "42" }, { "n": "其他动漫", "v": "43" }] },
            { "key": "year", "name": "年份", "value": [{ "n": "全部", "v": "" }].concat(Array.from({ length: 15 }, (_, i) => ({ "n": `${2025 - i}`, "v": `${2025 - i}` }))) }
        ]
    };

    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page || 1;
    const extend = inReq.body.filters || {};
    
    const classId = extend.class || tid;
    const year = extend.year || '';
    const link = HOST + `/vodshow/${classId}--------${pg}---${year}/`;
    
    const html = await request(link);
    const $ = load(html);
    const items = $('a.module-poster-item');
    
    let videos = _.map(items, (item) => {
        const it = $(item);
        const img = it.find('img:first');
        return {
            vod_id: it.attr('href'),
            vod_name: it.attr('title'),
            vod_pic: fixUrl(img.attr('data-original') || img.attr('src')),
            vod_remarks: it.find('.module-item-note').text().trim(),
        };
    });

    return JSON.stringify({
        page: parseInt(pg),
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const url = id.startsWith('http') ? id : fixUrl(id);
        const html = await request(url);
        const $ = load(html);

        const vod = {
            vod_id: id,
            vod_name: $('h1').first().text().trim(),
            vod_pic: fixUrl($('.module-item-pic img').first().attr('data-original')),
            vod_content: $('.introduction-content p').text().trim() || "暂无简介",
            vod_year: ($('a[href*="vodshow"]').filter((i, el) => $(el).text().match(/\d{4}/)).text()) || "",
            vod_director: $('.module-info-item:contains("导演") a').map((i, a) => $(a).text()).get().join('/'),
            vod_actor: $('.module-info-item:contains("主演") a').map((i, a) => $(a).text()).get().join('/'),
        };

        let playMap = {};
        const tabs = $('.module-tab-item span');
        const lists = $('.module-play-list-content');

        tabs.each((i, tab) => {
            const from = $(tab).text().trim();
            const listItems = $(lists[i]).find('a');
            if (!playMap[from]) playMap[from] = [];

            listItems.each((j, item) => {
                const title = $(item).find('span').text().trim() || $(item).text().trim();
                const playHref = $(item).attr('href');
                const playId = playHref.match(/\/play\/(.*?)\//)?.[1] || playHref;
                playMap[from].push(title + '$' + playId);
            });
        });

        vod.vod_play_from = _.keys(playMap).join('$$$');
        vod.vod_play_url = _.values(playMap).map(urls => urls.join('#')).join('$$$');
        videos.push(vod);
    }

    return { list: videos };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const link = HOST + `/play/${id}/`;
    const html = await request(link);
    
    const m3u8Match = html.match(/"url":"([^"]+\.m3u8)"/);
    if (m3u8Match) {
        return JSON.stringify({
            parse: 0,
            url: m3u8Match[1].replace(/\\/g, ""),
            header: { 'User-Agent': UA }
        });
    }

    return JSON.stringify({
        parse: 1,
        url: link,
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    const pg = inReq.body.page || 1;
    const searchUrl = HOST + `/vodsearch/${encodeURIComponent(wd)}----------${pg}---/`;
    
    const html = await request(searchUrl);
    const $ = load(html);
    
    let videos = $('.module-card-item.module-item').map((i, item) => {
        const it = $(item);
        const link = it.find('.module-card-item-title a');
        return {
            vod_id: link.attr('href'),
            vod_name: link.text().trim(),
            vod_pic: fixUrl(it.find('.module-item-pic img').attr('data-original')),
            vod_remarks: it.find('.module-item-note').text().trim(),
        };
    }).get();

    return { list: videos };
}

export default {
    meta: {
        key: 'ylys',
        name: '影视 ┃ 😊永乐视频',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
    },
};