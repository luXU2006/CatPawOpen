import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;

let HOST = 'https://v.qq.com';
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': UA,
            'Referer': HOST,
        },
    });
    return res.data;
}

async function init(inReq, outResp) {
    return {};
}

async function home(inReq, outResp) {
    // 腾讯视频分类ID
    let classes = [
        { type_id: "2", type_name: "电视剧" },
        { type_id: "1", type_name: "电影" },
        { type_id: "10", type_name: "综艺" },
        { type_id: "4", type_name: "动漫" },
        { type_id: "9", type_name: "纪录片" }
    ];
    let filterObj = {};
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function homeVod(inReq, outResp) {
    try {
        const body = { id: "2", page: 1 };
        const mockReq = { body: body };
        const res = await category(mockReq, null);
        return res;
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;

    // 腾讯视频列表页数据获取
    // offset 计算: (page-1)*30
    const offset = (pg - 1) * 30;
    let link = `https://v.qq.com/x/bu/pagesheet/list?_all=1&append=1&channel=${tid}&listpage=2&offset=${offset}&pagesize=30&sort=18`;

    let videos = [];
    try {
        const html = await request(link);
        if (html) {
            // 使用正则匹配列表项
            const listMatch = html.match(/<div class="list_item"[^>]*>[\s\S]*?<\/div>/g);
            if (listMatch) {
                listMatch.forEach(item => {
                    // 提取CID (Cover ID)
                    let href = item.match(/href="https:\/\/v\.qq\.com\/x\/cover\/([^.]+)\.html"/);
                    let id = href ? href[1] : "";
                    
                    // 提取图片
                    let img = item.match(/src="([^"]+)"/);
                    let pic = img ? img[1] : "";
                    if(pic && pic.startsWith('//')) pic = 'https:' + pic;

                    // 提取标题
                    let title = item.match(/title="([^"]+)"/);
                    let name = title ? title[1] : "";

                    // 提取状态 (更新至xx集)
                    let stat = item.match(/class="figure_caption"[^>]*>([^<]+)</);
                    let remarks = stat ? stat[1] : "";

                    if (id && name) {
                        videos.push({
                            vod_id: id,
                            vod_name: name,
                            vod_pic: pic,
                            vod_remarks: remarks,
                        });
                    }
                });
            }
        }
    } catch (e) {
        console.error("Category error:", e);
    }

    return JSON.stringify({
        page: parseInt(pg),
        pagecount: videos.length === 30 ? parseInt(pg) + 1 : parseInt(pg),
        limit: 30,
        total: 999,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const url = `https://v.qq.com/x/cover/${id}.html`;
        try {
            const html = await request(url);
            if (!html) continue;

            let vod = {
                vod_id: id,
                vod_name: "",
                vod_pic: "",
                vod_type: "",
                vod_area: "",
                vod_content: "",
                vod_actor: "",
                vod_director: "",
            };

            // 提取 COVER_INFO (包含大部分详情信息)
            let coverInfoMatch = html.match(/var\s+COVER_INFO\s*=\s*({[\s\S]*?});/);
            if (coverInfoMatch) {
                try {
                    // 简单的正则提取，避免 JSON.parse 失败
                    let info = coverInfoMatch[1];
                    
                    let titleM = info.match(/title\s*:\s*"([^"]+)"/);
                    vod.vod_name = titleM ? titleM[1] : "";

                    let picM = info.match(/vertical_pic_url\s*:\s*"([^"]+)"/);
                    vod.vod_pic = picM ? picM[1] : "";

                    let descM = info.match(/description\s*:\s*"([^"]+)"/);
                    vod.vod_content = descM ? descM[1] : "";
                    
                    // 年份/地区等通常比较难正则，这里留空或后续补充
                } catch (e) {}
            }
            
            // 兜底匹配
            if (!vod.vod_name) {
                let t = html.match(/<title>([^<]+)<\/title>/);
                if (t) vod.vod_name = t[1].split('_')[0];
            }

            // 提取选集列表
            let epList = [];
            // 匹配所有指向视频的链接 (正片通常含有 /x/cover/cid/vid.html)
            // 这种正则比较粗暴，但能匹配到大部分列表
            const linkRegex = /href="(\/x\/cover\/[^/]+\/([^.]+)\.html)"[^>]*title="([^"]+)"/g;
            let match;
            
            // 使用 Set 去重
            let urlSet = new Set();

            while ((match = linkRegex.exec(html)) !== null) {
                let linkUrl = match[1]; // /x/cover/cid/vid.html
                let vid = match[2];
                let title = match[3];
                
                // 简单的过滤，防止重复
                if (!urlSet.has(vid)) {
                    // 过滤非正片(简单逻辑：标题不含"预告")
                    if (!title.includes("预告") && !title.includes("花絮")) {
                         epList.push({
                            title: title,
                            url: `https://v.qq.com${linkUrl}`
                        });
                        urlSet.add(vid);
                    }
                }
            }

            // 如果没抓到集数（可能是电影，只有一个播放页）
            if (epList.length === 0) {
                 epList.push({
                     title: "正片",
                     url: `https://v.qq.com/x/cover/${id}.html`
                 });
            }

            // 排序 (倒序或正序，腾讯有时候HTML顺序是乱的，这里保持网页顺序)
            
            let playUrlStr = epList.map(it => {
                return `${it.title}$${it.url}`;
            }).join("#");

            vod.vod_play_from = "腾讯视频";
            vod.vod_play_url = playUrlStr;

            videos.push(vod);
        } catch (e) {
            console.error("Detail error:", e);
        }
    }

    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id; 
    
    // 务必在此处填入你的 VIP 解析接口地址
    const parseApi = "https://lanmeio.com/guanfang/zkk.php?key=HX8fK2zQ9wP3sY7dE1rT5gB4vC6nM8jL&url=";
                               "https://api.huohua.live/api/?key=v8GHObhk1dzFZ23Lom&url=",
    const targetUrl = parseApi + id; // 腾讯通常直接拼接完整URL即可

    try {
        const res = await request(targetUrl);
        let json = res;
        if (typeof res === 'string') {
            try {
                json = JSON.parse(res);
            } catch (e) {
                console.error("JSON Parse Error:", e);
            }
        }

        if (json && json.url) {
            return JSON.stringify({
                parse: 0, 
                url: json.url,
                header: {
                    'User-Agent': UA
                }
            });
        }
    } catch (e) {
        console.error("Parse Error:", e);
    }

    return JSON.stringify({
        parse: 1,
        url: id,
        header: {
            'User-Agent': UA
        }
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;

    // 搜索只取第一页，翻页比较复杂
    if (pg > 1) return JSON.stringify({ list: [] });

    const link = `https://v.qq.com/x/search/?q=${encodeURIComponent(wd)}`;
    let videos = [];
    try {
        const html = await request(link);
        if (html) {
            // 匹配结果块
            let blocks = html.split('class="result_item');
            for (let i = 1; i < blocks.length; i++) {
                let block = blocks[i];
                
                // 提取链接和ID
                let hrefM = block.match(/href="(https:\/\/v\.qq\.com\/x\/cover\/([^.]+)\.html)"/);
                if (hrefM) {
                    let id = hrefM[2];
                    
                    // 提取标题 (去除em标签)
                    let titleM = block.match(/title="([^"]+)"/);
                    let name = titleM ? titleM[1].replace(/<\/?em>/g, "") : "";
                    
                    // 提取图片
                    let picM = block.match(/src="([^"]+)"/);
                    let pic = picM ? picM[1] : "";
                    if(pic && pic.startsWith('//')) pic = 'https:' + pic;

                    // 提取状态
                    let statM = block.match(/class="figure_caption"[^>]*>([^<]+)</);
                    let remarks = statM ? statM[1] : "";

                    videos.push({
                        vod_id: id,
                        vod_name: name,
                        vod_pic: pic,
                        vod_remarks: remarks
                    });
                }
            }
        }
    } catch (e) {
        console.error("Search error:", e);
    }

    return JSON.stringify({
        list: videos
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
        printErr(resp.json());
        
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: "2",
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
            wd: '繁花',
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
        key: 'qq',
        name: '腾讯QQ',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/home_vod', homeVod);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};

