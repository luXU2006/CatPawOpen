import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';
import { privateDecrypt, constants } from 'crypto';

let HOST = 'https://api.w32z7vtd.com';
const TOKEN = '1be86e8e18a9fa18b2b8d5432699dad0.ac008ed650fd087bfbecf2fda9d82e9835253ef24843e6b18fcd128b10763497bcf9d53e959f5377cde038c20ccf9d17f604c9b8bb6e61041def86729b2fc7408bd241e23c213ac57f0226ee656e2bb0a583ae0e4f3bf6c6ab6c490c9a6f0d8cdfd366aacf5d83193671a8f77cd1af1ff2e9145de92ec43ec87cf4bdc563f6e919fe32861b0e93b118ec37d8035fbb3c.59dd05c5d9a8ae726528783128218f15fe6f2c0c8145eddab112b374fcfe3d79';
const HEADERS = {
    'Cache-Control': 'no-cache',
    'Version': '2406025',
    'PackageName': 'com.uf076bf0c246.qe439f0d5e.m8aaf56b725a.ifeb647346f',
    'Ver': '1.9.2',
    'Referer': HOST,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'okhttp/3.12.0'
};

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGAe6hKrWLi1zQmjTT1
ozbE4QdFeJGNxubxld6GrFGximxfMsMB6BpJhpcTouAqywAFppiKetUBBbXwYsYU
1wNr648XVmPmCMCy4rY8vdliFnbMUj086DU6Z+/oXBdWU3/b1G0DN3E9wULRSwcK
ZT3wj/cCI1vsCm3gj2R5SqkA9Y0CAwEAAQKBgAJH+4CxV0/zBVcLiBCHvSANm0l7
HetybTh/j2p0Y1sTXro4ALwAaCTUeqdBjWiLSo9lNwDHFyq8zX90+gNxa7c5EqcW
V9FmlVXr8VhfBzcZo1nXeNdXFT7tQ2yah/odtdcx+vRMSGJd1t/5k5bDd9wAvYdI
DblMAg+wiKKZ5KcdAkEA1cCakEN4NexkF5tHPRrR6XOY/XHfkqXxEhMqmNbB9U34
saTJnLWIHC8IXys6Qmzz30TtzCjuOqKRRy+FMM4TdwJBAJQZFPjsGC+RqcG5UvVM
iMPhnwe/bXEehShK86yJK/g/UiKrO87h3aEu5gcJqBygTq3BBBoH2md3pr/W+hUM
WBsCQQChfhTIrdDinKi6lRxrdBnn0Ohjg2cwuqK5zzU9p/N+S9x7Ck8wUI53DKm8
jUJE8WAG7WLj/oCOWEh+ic6NIwTdAkEAj0X8nhx6AXsgCYRql1klbqtVmL8+95KZ
K7PnLWG/IfjQUy3pPGoSaZ7fdquG8bq8oyf5+dzjE/oTXcByS+6XRQJAP/5ciy1b
L3NhUhsaOVy55MHXnPjdcTX0FaLi+ybXZIfIQ2P4rb19mVq1feMbCXhz+L1rG8oa
t5lYKfpe8k83ZA==
-----END PRIVATE KEY-----`;

function aesEncrypt(text, key, iv) {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const ivHex = CryptoJS.enc.Utf8.parse(iv);
    const encrypted = CryptoJS.AES.encrypt(text, keyHex, {
        iv: ivHex,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.ciphertext.toString().toUpperCase();
}

function aesDecrypt(text, key, iv) {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const ivHex = CryptoJS.enc.Utf8.parse(iv);
    const encryptedHex = CryptoJS.enc.Hex.parse(text);
    const src = CryptoJS.lib.CipherParams.create({ ciphertext: encryptedHex });
    const decrypted = CryptoJS.AES.decrypt(src, keyHex, {
        iv: ivHex,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function rsaDecrypt(data) {
    try {
        const buffer = Buffer.from(data, 'base64');
        const decrypted = privateDecrypt({
            key: PRIVATE_KEY,
            padding: constants.RSA_PKCS1_PADDING
        }, buffer);
        return decrypted.toString('utf8');
    } catch (e) {
        console.error('RSA Decrypt Error:', e);
        return "";
    }
}

async function getData(data, path) {
    try {
        const requestKey = aesEncrypt(JSON.stringify(data), 'mvXBSW7ekreItNsT', '2U3IrJL8szAKp0Fj');
        if (!requestKey) return null;

        const t = Math.floor(Date.now() / 1000).toString();
        const keys = "Qmxi5ciWXbQzkr7o+SUNiUuQxQEf8/AVyUWY4T/BGhcXBIUz4nOyHBGf9A4KbM0iKF3yp9M7WAY0rrs5PzdTAOB45plcS2zZ0wUibcXuGJ29VVGRWKGwE9zu2vLwhfgjTaaDpXo4rby+7GxXTktzJmxvneOUdYeHi+PZsThlvPI=";
        const signStr = `token_id=,token=${TOKEN},phone_type=1,request_key=${requestKey},app_id=1,time=${t},keys=${keys}*&zvdvdvddbfikkkumtmdwqppp?|4Y!s!2br`;
        const signature = CryptoJS.MD5(signStr).toString();

        const body = {
            'token': TOKEN,
            'token_id': '',
            'phone_type': '1',
            'time': t,
            'phone_model': 'xiaomi-22021211rc',
            'keys': keys,
            'request_key': requestKey,
            'signature': signature,
            'app_id': '1',
            'ad_version': '1'
        };

        const res = await req(HOST + path, {
            method: 'post',
            headers: HEADERS,
            data: body
        });

        if (!res.data || !res.data.data) {
            console.error(`API return error for path: ${path}`);
            return null;
        }

        const dataResponse = res.data.data;
        const bodykiJson = rsaDecrypt(dataResponse.keys);
        if (!bodykiJson) return null;

        const bodyki = JSON.parse(bodykiJson);
        const decryptedData = aesDecrypt(dataResponse.response_key, bodyki.key, bodyki.iv);

        if (!decryptedData) return null;
        return JSON.parse(decryptedData);

    } catch (e) {
        console.error(`getData Error: ${e.message} path: ${path}`);
        return null;
    }
}

async function init(inReq, outResp) {
    return {};
}

async function home(inReq, outResp) {
    let classes = [
        {"type_name": "电影", "type_id": "1"},
        {"type_name": "电视剧", "type_id": "2"},
        {"type_name": "动漫", "type_id": "4"},
        {"type_name": "综艺", "type_id": "3"},
        {"type_name": "短剧", "type_id": "64"}
    ];

    let filterTemplate = [
        {"key": "area", "name": "地区", "value": [
            {"n": "全部", "v": "0"}, {"n": "大陆", "v": "大陆"}, {"n": "香港", "v": "香港"}, {"n": "台湾", "v": "台湾"},
            {"n": "美国", "v": "美国"}, {"n": "韩国", "v": "韩国"}, {"n": "日本", "v": "日本"}, {"n": "英国", "v": "英国"},
            {"n": "法国", "v": "法国"}, {"n": "泰国", "v": "泰国"}, {"n": "印度", "v": "印度"}, {"n": "其他", "v": "其他"}
        ]},
        {"key": "year", "name": "年份", "value": [
            {"n": "全部", "v": "0"}, {"n": "2025", "v": "2025"}, {"n": "2024", "v": "2024"}, {"n": "2023", "v": "2023"},
            {"n": "2022", "v": "2022"}, {"n": "2021", "v": "2021"}, {"n": "2020", "v": "2020"}, {"n": "2019", "v": "2019"},
            {"n": "2018", "v": "2018"}, {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"}, {"n": "2015", "v": "2015"},
            {"n": "2014", "v": "2014"}, {"n": "2013", "v": "2013"}, {"n": "2012", "v": "2012"}, {"n": "2011", "v": "2011"},
            {"n": "2010", "v": "2010"}, {"n": "2009", "v": "2009"}, {"n": "2008", "v": "2008"}, {"n": "2007", "v": "2007"},
            {"n": "2006", "v": "2006"}, {"n": "2005", "v": "2005"}, {"n": "更早", "v": "2004"}
        ]},
        {"key": "sort", "name": "排序", "value": [
            {"n": "最新", "v": "d_id"}, {"n": "最热", "v": "d_hits"}, {"n": "推荐", "v": "d_score"}
        ]}
    ];

    let filterObj = {};
    for (const cls of classes) {
        filterObj[cls.type_id] = JSON.parse(JSON.stringify(filterTemplate));
    }

    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters || {};
    if (pg <= 0) pg = 1;

    const body = {
        "area": extend.area || '0',
        "year": extend.year || '0',
        "pageSize": "30",
        "sort": extend.sort || 'd_id',
        "page": pg.toString(),
        "tid": tid.toString()
    };

    const data = await getData(body, '/App/IndexList/indexList');
    let videos = [];
    if (data && data.list) {
        videos = _.map(data.list, (item) => {
            const vod_continu = item.vod_continu || 0;
            const remarks = vod_continu == 0 ? '电影' : `更新至${vod_continu}集`;
            return {
                vod_id: `${item.vod_id}/${vod_continu}`,
                vod_name: item.vod_name,
                vod_pic: item.vod_pic,
                vod_remarks: remarks,
            };
        });
    }

    return JSON.stringify({
        page: parseInt(pg),
        pagecount: 9999,
        limit: 30,
        total: 999999,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const realId = id.split('/')[0];
        const t = Math.floor(Date.now() / 1000).toString();

        // Fetch Info
        const infoBody = {
            "token_id": "1649412",
            "vod_id": realId,
            "mobile_time": t,
            "token": TOKEN
        };
        const infoData = await getData(infoBody, '/App/IndexPlay/playInfo');

        // Fetch Playlist
        const playlistBody = {
            "vurl_cloud_id": "2",
            "vod_d_id": realId
        };
        const playlistData = await getData(playlistBody, '/App/Resource/Vurl/show');

        if (infoData && infoData.vodInfo) {
            const vod = infoData.vodInfo;
            let vodObj = {
                vod_id: realId,
                vod_name: vod.vod_name || '',
                vod_pic: vod.vod_pic || '',
                vod_year: vod.vod_year || '',
                vod_area: vod.vod_area || '',
                vod_actor: vod.vod_actor || '',
                vod_director: vod.vod_director || '',
                vod_content: (vod.vod_use_content || '').trim(),
                vod_play_from: '瓜子'
            };

            let playList = [];
            if (playlistData && playlistData.list) {
                _.each(playlistData.list, (item, index) => {
                    if (item.play) {
                        let names = [];
                        let params = [];
                        _.each(item.play, (val, key) => {
                            if (val.param) {
                                names.push(key);
                                params.push(val.param);
                            }
                        });

                        if (params.length > 0) {
                            let playName = (index + 1).toString();
                            if (playlistData.list.length === 1) {
                                playName = vod.vod_name;
                            }
                            // Combine params and names like the Python script
                            const playUrl = `${params[params.length - 1]}||${names.join('@')}`;
                            playList.push(`${playName}$${playUrl}`);
                        }
                    }
                });
            }
            vodObj.vod_play_url = playList.join('#');
            videos.push(vodObj);
        }
    }
    
    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id; // Expected: param||resolutions
    const parts = id.split('||');
    if (parts.length < 2) {
        return JSON.stringify({ parse: 0, url: "" });
    }

    const paramStr = parts[0];
    const resolutions = parts[1].split('@');
    
    let params = {};
    paramStr.split('&').forEach(pair => {
        if (pair.includes('=')) {
            const [k, v] = pair.split('=', 2);
            params[k] = v;
        }
    });

    if (resolutions.length > 0) {
        // Sort resolutions desc
        resolutions.sort((a, b) => {
            const valA = parseInt(a) || 0;
            const valB = parseInt(b) || 0;
            return valB - valA;
        });

        params['resolution'] = resolutions[0];
        
        const data = await getData(params, '/App/Resource/VurlDetail/showOne');
        if (data && data.url) {
            return JSON.stringify({
                parse: 0,
                url: data.url,
                header: HEADERS
            });
        }
    }

    return JSON.stringify({
        parse: 0,
        url: "",
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page || 1;

    const body = {
        "keywords": wd,
        "order_val": "1",
        "page": pg.toString()
    };

    const data = await getData(body, '/App/Index/findMoreVod');
    let videos = [];
    if (data && data.list) {
        videos = _.map(data.list, (item) => {
            const vod_continu = item.vod_continu || 0;
            const remarks = vod_continu == 0 ? '电影' : `更新至${vod_continu}集`;
            return {
                vod_id: `${item.vod_id}/${vod_continu}`,
                vod_name: item.vod_name,
                vod_pic: item.vod_pic,
                vod_remarks: remarks,
            };
        });
    }

    return {
        page: parseInt(pg),
        pagecount: 9999,
        limit: 30,
        total: 999999,
        list: videos,
    };
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
                    dataResult.play = [];
                    for (const vod of dataResult.detail.list) {
                        const flags = vod.vod_play_from.split('$$$');
                        const ids = vod.vod_play_url.split('$$$');
                        for (let j = 0; j < flags.length; j++) {
                            const flag = flags[j];
                            const urls = ids[j].split('#');
                            for (let i = 0; i < urls.length && i < 2; i++) {
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
        }
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '暴走',
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
        key: 'guazi',
        name: '影视 ┃ 🍉瓜子APP',
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