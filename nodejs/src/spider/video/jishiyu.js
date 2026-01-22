import req from '../../util/req.js';
import { formatPlayUrl } from '../../util/misc.js';

let url = 'http://box.9box.xyz';
const UA = 'okhttp/3.12.11';

async function request(path, params = {}) {
    let uri = url + path;
    const searchParams = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== '') {
            searchParams.append(key, params[key]);
        }
    }
    const queryString = searchParams.toString();
    if (queryString) {
        uri += '?' + queryString;
    }

    const res = await req.get(uri, {
        headers: {
            'User-Agent': UA,
        },
    });
    return res.data;
}

function getList(data) {
    let videos = [];
    if (data) {
        for (const vod of data) {
            let remarks = '';
            if (vod.updateInfo) {
                remarks = `更新至${vod.updateInfo}`;
            } else if (vod.score) {
                remarks = vod.score;
            }
            videos.push({
                vod_id: vod.id,
                vod_name: vod.name,
                vod_pic: vod.pic,
                vod_remarks: remarks,
            });
        }
    }
    return videos;
}

async function init(inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    const data = await request('/api.php/v2.vod/androidtypes');
    let classes = [];
    let filterObj = {};

    if (data && data.data) {
        const dy = {
            classes: '类型',
            areas: '地区',
            years: '年份',
            sortby: '排序',
        };

        const demos = ['时间', '人气', '评分'];

        for (const item of data.data) {
            let typeId = item.type_id.toString();
            classes.push({
                type_id: typeId,
                type_name: item.type_name,
            });

            item['sortby'] = ['updatetime', 'hits', 'score'];

            let typeFilters = [];
            let hasNonEmptyField = false;
            for (const key in dy) {
                if (item[key] && item[key].length > 1) {
                    hasNonEmptyField = true;
                    break;
                }
            }

            if (hasNonEmptyField) {
                for (const dkey in dy) {
                    if (item[dkey] && item[dkey].length > 1) {
                        let values = item[dkey];
                        let valueArray = [];

                        for (let idx = 0; idx < values.length; idx++) {
                            let val = values[idx];
                            if (val && val.trim() !== '') {
                                if (dkey === 'sortby') {
                                    valueArray.push({ n: demos[idx] || val, v: val.trim() });
                                } else {
                                    valueArray.push({ n: val.trim(), v: val.trim() });
                                }
                            }
                        }

                        if (valueArray.length > 0) {
                            typeFilters.push({
                                key: dkey,
                                name: dy[dkey],
                                value: valueArray,
                            });
                        }
                    }
                }
                if (typeFilters.length > 0) {
                    filterObj[typeId] = typeFilters;
                }
            }
        }
    }

    return {
        class: classes,
        filters: filterObj,
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page || 1;
    const extend = inReq.body.filters || {};

    const params = {
        page: pg,
        type: tid,
        area: extend.area || '',
        year: extend.year || '',
        sortby: extend.sortby || '',
        class: extend.class || '',
    };

    const rsp = await request('/api.php/v2.vod/androidfilter10086', params);

    return {
        page: parseInt(pg),
        pagecount: 9999,
        limit: 90,
        total: 999999,
        list: getList(rsp.data),
    };
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const rsp = await request('/api.php/v3.vod/androiddetail2', { vod_id: id });
        const v = rsp.data;

        if (!v) continue;

        let play_items = [];
        const urls = v.urls || [];

        const allowed_chinese_keywords = [
            '蓝光', '超清', '高清', '标清', '枪版', '全清',
            '全集', '全', '完整版', '正片', '预告', '花絮'
        ];

        for (const i of urls) {
            let key = (i.key || i.name || '').trim();
            let pUrl = (i.url || '').trim();

            if (key && pUrl) {
                if (allowed_chinese_keywords.includes(key)) {
                    play_items.push(`${key}$${pUrl}`);
                } else {
                    let matched = false;
                    if (/^\d+$/.test(key)) matched = true;
                    else if (/^\d+-\d+$/.test(key)) matched = true;
                    else if (/^第\d+[集期话节]$/.test(key)) matched = true;
                    else if (/^第\d+季$/.test(key)) matched = true;
                    else if (/^[集期话]?\d+$/.test(key)) matched = true;
                    else if (/^E[P]?\d+$/i.test(key)) matched = true;
                    else if (/^\d+[PpKk]$/.test(key)) matched = true;
                    else if (/^[Hh][Dd]$/.test(key)) matched = true;
                    else if (/^[Ff][Hh][Dd]$/.test(key)) matched = true;
                    else if (/^[Uu][Hh][Dd]$/.test(key)) matched = true;

                    if (matched) {
                        play_items.push(`${key}$${pUrl}`);
                    }
                }
            }
        }

        const vod = {
            vod_id: v.id,
            vod_name: v.name,
            vod_pic: v.pic,
            vod_year: v.year,
            vod_area: v.area,
            vod_lang: v.lang,
            type_name: v.className,
            vod_actor: v.actor || '未知',
            vod_director: v.director || '未知',
            vod_content: v.content || '暂无简介',
            vod_play_from: '及时雨',
            vod_play_url: play_items.join('#'),
        };
        videos.push(vod);
    }

    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    let playUrl = id;

    if (playUrl.indexOf('http') === -1) {
        playUrl = `http://c.xpgtv.net/m3u8/${playUrl}.m3u8`;
    }

    const header = {
        'user_id': 'JSYBOX',
        'token2': 'fXk3sAyqkwgwRm8DRSqFMKdUGqn28BZUoPc4m0HPZtp3Dnsusxc8mfRSg98=',
        'version': 'JSYBOX com.phoenix.jsy.box1.0.5',
        'hash': 'fcb9',
        'screenx': '2568',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'token': 'UkVQvnKFg387f2pSex23Ar1fPfD4ww8ju9BplAu/ZoNfM0o1kgZH2vZNxN9EUFS+BiEyB/fGa4cPNZkOZQJqe/ApC3U9wm2iHVNDYpliWyJdpXsGUF1phi27iSLuL2FdkIUxFzlzRrfs7EEYUDcn7ay0UW0I+CiJsirsUJHwBSLjXl9+W1dmHUogbL59VrqTWSnVhg==',
        'timestamp': '1765796961',
        'screeny': '1184',
    };

    return {
        parse: 0,
        url: playUrl,
        header: header
    };
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page || 1;
    const wd = inReq.body.wd;

    const rsp = await request('/api.php/v2.vod/androidsearch10086', {
        page: pg,
        wd: wd
    });

    let videos = [];
    if (rsp && rsp.data) {
        videos = getList(rsp.data);
    }

    return {
        page: parseInt(pg),
        pagecount: 9999,
        limit: 90,
        total: 999999,
        list: videos,
    };
}

async function test(inReq, outResp) {
    try {
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();

        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();

        if (dataResult.home.class.length > 0) {
            const firstType = dataResult.home.class[0];
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: firstType.type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();

            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id,
                });
                dataResult.detail = resp.json();

                if (dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    const vod = dataResult.detail.list[0];
                    const flags = vod.vod_play_from.split('$$$');
                    const ids = vod.vod_play_url.split('$$$');

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
            wd: '爱',
            page: 1,
        });
        dataResult.search = resp.json();

        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'jishiyu',
        name: '及时雨(Xpg)',
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