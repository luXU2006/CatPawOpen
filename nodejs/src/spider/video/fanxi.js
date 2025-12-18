import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';
import { load } from 'cheerio'; 
import axios from 'axios';

let HOST = 'https://admin:drpys@drpy.ddcm.dpdns.org'; //道长DS项目地址
let API_URL = HOST + 'https://admin:drpys@drpy.ddcm.dpdns.org/api/AppToV5?do=py&pwd=dzyyds&extend=http://118.89.203.120:8762&filter=true'; //填入api相关参数

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || UA,
        },
    });
    return res.data;
}

async function init(inReq, outResp) {
    return {}
}

async function home(inReq, outResp) {
    let data = await request(API_URL);
    if (typeof data === 'string') data = JSON.parse(data);

    let classes = [];
    if (data.class && data.class.length > 0) {
        classes = data.class;
    }
    
    let filterObj = {};

    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function homeVod(inReq, outResp) {
    let data = await request(API_URL);
    if (typeof data === 'string') data = JSON.parse(data);
    let videos = [];
    if (data.list && data.list.length > 0) {
        videos = data.list;
    }
    return JSON.stringify({
        list: videos
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (!pg || pg <= 0) pg = 1;
    
    const link = `${API_URL}&ac=videolist&t=${tid}&pg=${pg}`;
    
    let data = await request(link);
    if (typeof data === 'string') data = JSON.parse(data);
    
    let videos = [];
    if (data.list && data.list.length > 0) {
        videos = data.list;
    }

    const currentPg = parseInt(pg);
    const hasMore = videos.length > 0;

    let pageCount = data.pagecount ? parseInt(data.pagecount) : (hasMore ? currentPg + 1 : currentPg);
    
    let total = data.total ? parseInt(data.total) : (hasMore ? 9999 : 0);
    
    let page = data.page ? parseInt(data.page) : currentPg;

    return JSON.stringify({
        page: page,
        pagecount: pageCount,
        limit: parseInt(data.limit || 20),
        total: total,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        let link = `${API_URL}&ac=detail&ids=${id}`;
        let data = await request(link);
        if (typeof data === 'string') data = JSON.parse(data);
        
        if (data.list && data.list.length > 0) {
            let vodNode = data.list[0];
            
            let vod = {
                vod_id: vodNode.vod_id,
                vod_name: vodNode.vod_name,
                vod_type: vodNode.type_name || '',
                vod_actor: vodNode.vod_actor || '',
                vod_pic: vodNode.vod_pic,
                vod_remarks: vodNode.vod_remarks || '',
                vod_content: vodNode.vod_content || '',
                vod_area: vodNode.vod_area || '',
                vod_year: vodNode.vod_year || '',
                vod_director: vodNode.vod_director || '',
            };

            vod.vod_play_from = vodNode.vod_play_from;
            vod.vod_play_url = vodNode.vod_play_url;
            
            videos.push(vod);
        }
    }
    
    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const flag = inReq.body.flag;
    
    if (/^http/.test(id)) {
        return JSON.stringify({
            parse: 0, 
            url: id,
        });
    }

    const link = `${API_URL}&ac=play&play=${id}&flag=${flag}`;
    let data = await request(link);
    if (typeof data === 'string') data = JSON.parse(data);
    
    return JSON.stringify({
        parse: 0,
        url: data.url || data.video || id,
        header: {
            'User-Agent': UA
        }
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page || 1;
    
    const link = `${API_URL}&ac=search&wd=${encodeURIComponent(wd)}&pg=${pg}`;
    let data = await request(link);
    if (typeof data === 'string') data = JSON.parse(data);

    let videos = [];
    if (data.list && data.list.length > 0) {
        videos = data.list.map(item => ({
            vod_id: item.vod_id,
            vod_name: item.vod_name,
            vod_pic: item.vod_pic,
            vod_remarks: item.vod_remarks || ''
        }));
    }
    
    return JSON.stringify({
        list: videos,
    });
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
            wd: '动作',
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
        key: '测试',
        name: '影视 ┃ 番喜APP',
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