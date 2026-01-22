import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';
import { load } from 'cheerio';

let HOST = 'https://www.mqtv.cc';
const KEY = 'Mcxos@mucho!nmme';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const PARSE_URL = 'http://nm.4688888.xyz/nm_free.php?url=';

async function request(url, refPath = '', isJson = true) {
    const headers = {
        'User-Agent': UA,
        'Accept': isJson ? 'application/json, text/javascript, */*; q=0.01' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'x-requested-with': 'XMLHttpRequest'
    };
    if (refPath) headers['referer'] = HOST + refPath;

    const res = await req(url, {
        method: 'get',
        headers: headers
    });
    return res.data;
}

function customEncode(data) {
    const jsonStr = JSON.stringify(data);
    const b64_1 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(jsonStr));
    let xorResult = "";
    for (let i = 0; i < b64_1.length; i++) {
        const keyIdx = i % KEY.length;
        xorResult += String.fromCharCode(b64_1.charCodeAt(i) ^ KEY.charCodeAt(keyIdx));
    }
    return encodeURIComponent(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(xorResult)));
}

function customDecode(encodedStr) {
    const xorStr = CryptoJS.enc.Base64.parse(encodedStr).toString(CryptoJS.enc.Utf8);
    let b64Result = "";
    for (let i = 0; i < xorStr.length; i++) {
        const keyIdx = i % KEY.length;
        b64Result += String.fromCharCode(xorStr.charCodeAt(i) ^ KEY.charCodeAt(keyIdx));
    }
    const jsonStr = CryptoJS.enc.Base64.parse(b64Result).toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonStr);
}

function aesDecrypt(encryptedStr, viewportMetaId, charsetMetaId) {
    let idTextList = [];
    for (let i = 0; i < charsetMetaId.length; i++) {
        idTextList.push({ id: charsetMetaId[i], text: viewportMetaId[i] || '' });
    }
    idTextList.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const seed = idTextList.map(item => item.text).join('');
    const md5Result = CryptoJS.MD5(seed + 'lemon').toString();
    
    const key = CryptoJS.enc.Utf8.parse(md5Result.substring(16));
    const iv = CryptoJS.enc.Utf8.parse(md5Result.substring(0, 16));
    const decrypted = CryptoJS.AES.decrypt(encryptedStr, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

async function getToken(path, refPath = '/') {
    const html = await request(HOST + path, refPath, false);
    const match = html.match(/window\.pageid\s?=\s?'(.*?)';/);
    const pageId = match ? match[1] : null;
    return customEncode(pageId);
}

function arr2vods(arr) {
    return (arr || []).map(i => ({
        vod_id: i.url,
        vod_name: i.title,
        vod_pic: i.img,
        vod_remarks: i.remark
    }));
}

async function init() { return {}; }

async function home() {
    return JSON.stringify({
        class: [
            { type_id: '/type/movie', type_name: '电影' },
            { type_id: '/type/tv', type_name: '电视剧' },
            { type_id: '/type/va', type_name: '综艺' },
            { type_id: '/type/ct', type_name: '动漫' }
        ]
    });
}

async function homeVod() {
    const token = await getToken('/');
    const res = await request(`${HOST}/libs/VodList.api.php?home=index&token=${token}`, '/');
    let videos = [];
    if (res.data && res.data.movie) {
        res.data.movie.forEach(i => {
            videos = videos.concat(arr2vods(i.show));
        });
    }
    return JSON.stringify({ list: videos });
}

async function category(inReq) {
    const tid = inReq.body.id;
    const pg = inReq.body.page || 1;
    const type = tid.split('/')[2];
    const token = await getToken(tid, '/');
    const url = `${HOST}/libs/VodList.api.php?type=${type}&rank=rankhot&cat=&year=&area=&page=${pg}&token=${token}`;
    const res = await request(url, tid);
    return JSON.stringify({ list: arr2vods(res.data), page: pg });
}

async function detail(inReq) {
    const id = Array.isArray(inReq.body.id) ? inReq.body.id[0] : inReq.body.id;
    const token = await getToken(id, '/');
    const vodId = id.split('/')[3];
    const url = `${HOST}/libs/VodInfo.api.php?type=ct&id=${vodId}&token=${token}`;
    const res = await request(url, id);
    const data = res.data;

    const parsesArr = (data.playapi || []).map(i => {
        let u = i.url;
        if (u.startsWith('//')) u = 'https:' + u;
        return u;
    });
    const parses = parsesArr.join(',');

    const shows = [];
    const playUrls = [];
    data.playinfo.forEach(j => {
        const urls = j.player.map(k => `${k.no}$${k.url}@${parses}`);
        if (urls.length > 0) {
            playUrls.push(urls.join('#'));
            shows.push(j.cnsite);
        }
    });

    return {
        list: [{
            vod_id: id,
            vod_name: data.title,
            vod_pic: data.img,
            vod_remarks: data.remark,
            vod_year: data.year,
            vod_area: data.area,
            vod_actor: data.actor,
            vod_director: data.director,
            vod_play_from: shows.join('$$$'),
            vod_play_url: playUrls.join('$$$')
        }]
    };
}

async function search(inReq) {
    const wd = inReq.body.wd;
    const path = `/search/${encodeURIComponent(wd)}`;
    const token = await getToken(path, '/');
    const url = `${HOST}/libs/VodList.api.php?search=${encodeURIComponent(wd)}&token=${token}`;
    const res = await request(url, path);
    const data = customDecode(res.data);
    let videos = [];
    if (data.vod_all) {
        data.vod_all.forEach(i => {
            if (i.show) videos = videos.concat(arr2vods(i.show));
        });
    }
    return { list: videos };
}

async function play(inReq) {
    const vid = inReq.body.id;
    const [rawUrl, parsesStr] = vid.split('@');
    const parses = parsesStr.split(',');
    let finalUrl = '';
    let sniff = 0;
    let jx = 0;

    for (const p of parses) {
        try {
            const html = await request(p + rawUrl, '', false);
            const charsetMatch = html.match(/id\s?=\s?"now_(.*?)"/i);
            const viewportMatch = html.match(/name\s?=\s?"viewport".*?id\s?=\s?"now_(.*?)"/i);
            const urlMatch = html.match(/"url"\s?:\s?"(.*?)"/i);

            if (charsetMatch && viewportMatch && urlMatch) {
                const playUrl = aesDecrypt(urlMatch[1], viewportMatch[1], charsetMatch[1]);
                if (playUrl.startsWith('http')) {
                    finalUrl = playUrl;
                    break;
                }
            }
        } catch (e) {}
    }

    if (!finalUrl) {
        if (/iqiyi|qq|youku|mgtv|bilibili/.test(rawUrl)) {
            finalUrl = PARSE_URL + encodeURIComponent(rawUrl);
            sniff = 1;
            jx = 1;
        } else {
            finalUrl = (parses[0] || '') + rawUrl;
            sniff = 1;
        }
    }

    return JSON.stringify({
        jx: jx,
        parse: sniff,
        url: finalUrl,
        header: { 'User-Agent': UA }
    });
}

export default {
    meta: {
        key: 'mgtv',
        name: '影视 ┃ 🐦麻雀视频',
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
    }
};