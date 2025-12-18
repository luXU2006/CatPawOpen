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
    let classes = [
        { type_id: "tv", type_name: "电视剧" },
        { type_id: "movie", type_name: "电影" },
        { type_id: "variety", type_name: "综艺" },
        { type_id: "cartoon", type_name: "动漫" },
        { type_id: "child", type_name: "少儿" },
        { type_id: "doco", type_name: "纪录片" }
    ];
    let filterObj = {
        "choice": [{
            "key": "sort",
            "name": "排序",
            "value": [{
                "n": "最热",
                "v": "75"
            }, {
                "n": "最新",
                "v": "83"
            }, {
                "n": "好评",
                "v": "81"
            }]
        }, {
            "key": "iyear",
            "name": "年代",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "2025",
                "v": "2025"
            }, {
                "n": "2024",
                "v": "2024"
            }, {
                "n": "2023",
                "v": "2023"
            }, {
                "n": "2022",
                "v": "2022"
            }, {
                "n": "2021",
                "v": "2021"
            }, {
                "n": "2020",
                "v": "2020"
            }, {
                "n": "2019",
                "v": "2019"
            }, {
                "n": "2018",
                "v": "2018"
            }, {
                "n": "2017",
                "v": "2017"
            }, {
                "n": "2016",
                "v": "2016"
            }, {
                "n": "2015",
                "v": "2015"
            }]
        }],
        "tv": [{
            "key": "sort",
            "name": "排序",
            "value": [{
                "n": "最热",
                "v": "75"
            }, {
                "n": "最新",
                "v": "79"
            }, {
                "n": "好评",
                "v": "16"
            }]
        }, {
            "key": "feature",
            "name": "类型",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "爱情",
                "v": "1"
            }, {
                "n": "古装",
                "v": "2"
            }, {
                "n": "悬疑",
                "v": "3"
            }, {
                "n": "都市",
                "v": "4"
            }, {
                "n": "家庭",
                "v": "5"
            }, {
                "n": "喜剧",
                "v": "6"
            }, {
                "n": "传奇",
                "v": "7"
            }, {
                "n": "武侠",
                "v": "8"
            }, {
                "n": "军旅",
                "v": "9"
            }, {
                "n": "权谋",
                "v": "10"
            }, {
                "n": "革命",
                "v": "11"
            }, {
                "n": "现实",
                "v": "13"
            }, {
                "n": "青春",
                "v": "14"
            }, {
                "n": "猎奇",
                "v": "15"
            }, {
                "n": "科幻",
                "v": "16"
            }, {
                "n": "竞技",
                "v": "17"
            }, {
                "n": "玄幻",
                "v": "18"
            }]
        }, {
            "key": "iyear",
            "name": "年代",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "2025",
                "v": "2025"
            }, {
                "n": "2024",
                "v": "2024"
            }, {
                "n": "2023",
                "v": "2023"
            }, {
                "n": "2022",
                "v": "2022"
            }, {
                "n": "2021",
                "v": "2021"
            }, {
                "n": "2020",
                "v": "2020"
            }, {
                "n": "2019",
                "v": "2019"
            }, {
                "n": "2018",
                "v": "2018"
            }, {
                "n": "2017",
                "v": "2017"
            }, {
                "n": "2016",
                "v": "2016"
            }, {
                "n": "2015",
                "v": "2015"
            }]
        }],
        "movie": [{
            "key": "sort",
            "name": "排序",
            "value": [{
                "n": "最热",
                "v": "75"
            }, {
                "n": "最新",
                "v": "83"
            }, {
                "n": "好评",
                "v": "81"
            }]
        }, {
            "key": "type",
            "name": "类型",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "犯罪",
                "v": "4"
            }, {
                "n": "励志",
                "v": "2"
            }, {
                "n": "喜剧",
                "v": "100004"
            }, {
                "n": "热血",
                "v": "100061"
            }, {
                "n": "悬疑",
                "v": "100009"
            }, {
                "n": "爱情",
                "v": "100005"
            }, {
                "n": "科幻",
                "v": "100012"
            }, {
                "n": "恐怖",
                "v": "100010"
            }, {
                "n": "动画",
                "v": "100015"
            }, {
                "n": "战争",
                "v": "100006"
            }, {
                "n": "家庭",
                "v": "100017"
            }, {
                "n": "剧情",
                "v": "100022"
            }, {
                "n": "奇幻",
                "v": "100016"
            }, {
                "n": "武侠",
                "v": "100011"
            }, {
                "n": "历史",
                "v": "100021"
            }, {
                "n": "老片",
                "v": "100013"
            }, {
                "n": "西部",
                "v": "3"
            }, {
                "n": "记录片",
                "v": "100020"
            }]
        }, {
            "key": "year",
            "name": "年代",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "2025",
                "v": "2025"
            }, {
                "n": "2024",
                "v": "2024"
            }, {
                "n": "2023",
                "v": "2023"
            }, {
                "n": "2022",
                "v": "2022"
            }, {
                "n": "2021",
                "v": "2021"
            }, {
                "n": "2020",
                "v": "2020"
            }, {
                "n": "2019",
                "v": "2019"
            }, {
                "n": "2018",
                "v": "2018"
            }, {
                "n": "2017",
                "v": "2017"
            }, {
                "n": "2016",
                "v": "2016"
            }, {
                "n": "2015",
                "v": "2015"
            }]
        }],
        "variety": [{
            "key": "sort",
            "name": "排序",
            "value": [{
                "n": "最热",
                "v": "75"
            }, {
                "n": "最新",
                "v": "23"
            }]
        }, {
            "key": "iyear",
            "name": "年代",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "2025",
                "v": "2025"
            }, {
                "n": "2024",
                "v": "2024"
            }, {
                "n": "2023",
                "v": "2023"
            }, {
                "n": "2022",
                "v": "2022"
            }, {
                "n": "2021",
                "v": "2021"
            }, {
                "n": "2020",
                "v": "2020"
            }, {
                "n": "2019",
                "v": "2019"
            }, {
                "n": "2018",
                "v": "2018"
            }, {
                "n": "2017",
                "v": "2017"
            }, {
                "n": "2016",
                "v": "2016"
            }, {
                "n": "2015",
                "v": "2015"
            }]
        }],
        "cartoon": [{
            "key": "sort",
            "name": "排序",
            "value": [{
                "n": "最热",
                "v": "75"
            }, {
                "n": "最新",
                "v": "83"
            }, {
                "n": "好评",
                "v": "81"
            }]
        }, {
            "key": "area",
            "name": "地区",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "内地",
                "v": "1"
            }, {
                "n": "日本",
                "v": "2"
            }, {
                "n": "欧美",
                "v": "3"
            }, {
                "n": "其他",
                "v": "4"
            }]
        }, {
            "key": "type",
            "name": "类型",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "玄幻",
                "v": "9"
            }, {
                "n": "科幻",
                "v": "4"
            }, {
                "n": "武侠",
                "v": "13"
            }, {
                "n": "冒险",
                "v": "3"
            }, {
                "n": "战斗",
                "v": "5"
            }, {
                "n": "搞笑",
                "v": "1"
            }, {
                "n": "恋爱",
                "v": "7"
            }, {
                "n": "魔幻",
                "v": "6"
            }, {
                "n": "竞技",
                "v": "20"
            }, {
                "n": "悬疑",
                "v": "17"
            }, {
                "n": "日常",
                "v": "15"
            }, {
                "n": "校园",
                "v": "16"
            }, {
                "n": "真人",
                "v": "18"
            }, {
                "n": "推理",
                "v": "14"
            }, {
                "n": "历史",
                "v": "19"
            }, {
                "n": "经典",
                "v": "3"
            }, {
                "n": "其他",
                "v": "12"
            }]
        }, {
            "key": "iyear",
            "name": "年代",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "2025",
                "v": "2025"
            }, {
                "n": "2024",
                "v": "2024"
            }, {
                "n": "2023",
                "v": "2023"
            }, {
                "n": "2022",
                "v": "2022"
            }, {
                "n": "2021",
                "v": "2021"
            }, {
                "n": "2020",
                "v": "2020"
            }, {
                "n": "2019",
                "v": "2019"
            }, {
                "n": "2018",
                "v": "2018"
            }, {
                "n": "2017",
                "v": "2017"
            }, {
                "n": "2016",
                "v": "2016"
            }, {
                "n": "2015",
                "v": "2015"
            }]
        }],
        "child": [{
            "key": "sort",
            "name": "排序",
            "value": [{
                "n": "最热",
                "v": "75"
            }, {
                "n": "最新",
                "v": "76"
            }, {
                "n": "好评",
                "v": "20"
            }]
        }, {
            "key": "sex",
            "name": "性别",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "女孩",
                "v": "1"
            }, {
                "n": "男孩",
                "v": "2"
            }]
        }, {
            "key": "area",
            "name": "地区",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "内地",
                "v": "3"
            }, {
                "n": "日本",
                "v": "2"
            }, {
                "n": "其他",
                "v": "1"
            }]
        }, {
            "key": "iyear",
            "name": "年龄段",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "0-3岁",
                "v": "1"
            }, {
                "n": "4-6岁",
                "v": "2"
            }, {
                "n": "7-9岁",
                "v": "3"
            }, {
                "n": "10岁以上",
                "v": "4"
            }, {
                "n": "全年龄段",
                "v": "7"
            }]
        }],
        "doco": [{
            "key": "sort",
            "name": "排序",
            "value": [{
                "n": "最热",
                "v": "75"
            }, {
                "n": "最新",
                "v": "74"
            }]
        }, {
            "key": "itrailer",
            "name": "出品方",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "BBC",
                "v": "1"
            }, {
                "n": "国家地理",
                "v": "4"
            }, {
                "n": "HBO",
                "v": "3175"
            }, {
                "n": "NHK",
                "v": "2"
            }, {
                "n": "历史频道",
                "v": "7"
            }, {
                "n": "ITV",
                "v": "3530"
            }, {
                "n": "探索频道",
                "v": "3174"
            }, {
                "n": "ZDF",
                "v": "3176"
            }, {
                "n": "腾讯自制",
                "v": "15"
            }, {
                "n": "合作机构",
                "v": "6"
            }, {
                "n": "其他",
                "v": "5"
            }]
        }, {
            "key": "type",
            "name": "类型",
            "value": [{
                "n": "全部",
                "v": "-1"
            }, {
                "n": "自然",
                "v": "4"
            }, {
                "n": "美食",
                "v": "10"
            }, {
                "n": "社会",
                "v": "3"
            }, {
                "n": "人文",
                "v": "6"
            }, {
                "n": "历史",
                "v": "1"
            }, {
                "n": "军事",
                "v": "2"
            }, {
                "n": "科技",
                "v": "8"
            }, {
                "n": "财经",
                "v": "14"
            }, {
                "n": "探险",
                "v": "15"
            }, {
                "n": "罪案",
                "v": "7"
            }, {
                "n": "竞技",
                "v": "12"
            }, {
                "n": "旅游",
                "v": "11"
            }]
        }]
    };
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

    const offset = (pg - 1) * 30;
    let sort = "18";
    
    let extraParams = "";
    if (inReq.body.filters) {
        for (const key in inReq.body.filters) {
            if (key === "sort") {
                sort = inReq.body.filters[key];
            } else {
                let paramKey = key;
                if (key === "iyear") paramKey = "year"; 
                extraParams += `&${paramKey}=${inReq.body.filters[key]}`;
            }
        }
    }

    let link = `https://v.qq.com/x/bu/pagesheet/list?_all=1&append=1&channel=${tid}&listpage=2&offset=${offset}&pagesize=30&sort=${sort}${extraParams}`;

    let videos = [];
    try {
        const html = await request(link);
        if (html) {
            const listMatch = html.match(/<div class="list_item"[^>]*>[\s\S]*?<\/div>/g);
            if (listMatch) {
                listMatch.forEach(item => {
                    let href = item.match(/href="https:\/\/v\.qq\.com\/x\/cover\/([^.]+)\.html"/);
                    let id = href ? href[1] : "";
                    
                    let img = item.match(/src="([^"]+)"/);
                    let pic = img ? img[1] : "";
                    if(pic && pic.startsWith('//')) pic = 'https:' + pic;

                    let title = item.match(/title="([^"]+)"/);
                    let name = title ? title[1] : "";

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
        let cid = id;
        if (id.includes('$')) {
            cid = id.split('$')[1];
        }

        let isVid = false;
        if (cid.length === 11) {
            isVid = true;
        }

        const paramKey = isVid ? "vid" : "cid";
        const detailUrl = `https://node.video.qq.com/x/api/float_vinfo2?${paramKey}=${cid}`;
        
        try {
            let jsonRes = await request(detailUrl);
            if (typeof jsonRes === 'string') {
                try { jsonRes = JSON.parse(jsonRes); } catch(e) {}
            }

            if (!jsonRes) continue;
            
            const json = jsonRes;
            const baseInfo = json.c || json.v || {};
            
            let vod = {
                vod_id: id,
                vod_name: baseInfo.title || json.chk_title || "",
                vod_pic: baseInfo.pic || baseInfo.pic_160_90 || baseInfo.pic_640_360 || "",
                vod_type: (baseInfo.typ || []).join(","),
                vod_actor: (baseInfo.nam || []).join(","),
                vod_year: baseInfo.year || "",
                vod_area: (baseInfo.ara || []).join(","),
                vod_content: baseInfo.description || "",
                vod_remarks: json.rec || "",
                vod_director: ""
            };

            let episodeList = [];
            
            if (isVid) {
                const url = `https://v.qq.com/x/page/${cid}.html`;
                episodeList.push({
                    title: "正片",
                    url: url,
                    type: "正片"
                });
            } 
            else {
                if (baseInfo.video_ids && baseInfo.video_ids.length > 0) {
                    const video_ids = baseInfo.video_ids;
                    
                    if (video_ids.length === 1) {
                        const vid = video_ids[0];
                        const url = `https://v.qq.com/x/cover/${cid}/${vid}.html`;
                        episodeList.push({
                            title: "正片",
                            url: url,
                            type: "正片"
                        });
                    } 
                    else {
                        const idGroups = [];
                        for (let i = 0; i < video_ids.length; i += 30) {
                            idGroups.push(video_ids.slice(i, i + 30));
                        }

                        for (const group of idGroups) {
                            const unionUrl = `https://union.video.qq.com/fcgi-bin/data?otype=json&tid=1804&appid=20001238&appkey=6c03bbe9658448a4&union_platform=1&idlist=${group.join(",")}`;
                            const res = await request(unionUrl);
                            
                            const match = res.match(/QZOutputJson=(.*?);?$/);
                            if (match) {
                                try {
                                    const data = JSON.parse(match[1]);
                                    if (data.results) {
                                        data.results.forEach(it => {
                                            const fields = it.fields;
                                            const vid = fields.vid;
                                            const url = `https://v.qq.com/x/cover/${cid}/${vid}.html`;
                                            
                                            let title = fields.title || "";
                                            if (!title || title.match(/^\d+$/)) {
                                                if(fields.episode_number) title = `第${fields.episode_number}集`;
                                            }
                                            if(!title) title = vid;

                                            let type = "正片"; 
                                            if (fields.category_map && fields.category_map.length > 1) {
                                                type = fields.category_map[1];
                                            }

                                            episodeList.push({
                                                title: title,
                                                url: url,
                                                type: type,
                                                raw_title: fields.title 
                                            });
                                        });
                                    }
                                } catch (e) {
                                    console.error("Union API parse error", e);
                                }
                            }
                        }
                    }
                }
            }

            if (episodeList.length === 0 && !isVid) {
                 episodeList.push({
                    title: "正片",
                    url: `https://v.qq.com/x/cover/${cid}.html`,
                    type: "正片"
                });
            }

            const trailers = episodeList.filter(it => it.type && (it.type.includes("预告") || it.type.includes("花絮")));
            const features = episodeList.filter(it => !it.type || (!it.type.includes("预告") && !it.type.includes("花絮")));

            let playFromArr = [];
            let playUrlArr = [];

            if (features.length > 0) {
                playFromArr.push("腾讯视频");
                playUrlArr.push(features.map(it => `${it.title}$${it.url}`).join("#"));
            }

            if (trailers.length > 0) {
                playFromArr.push("预告花絮");
                playUrlArr.push(trailers.map(it => `${it.title}$${it.url}`).join("#"));
            }

            if (playFromArr.length === 0) {
                 playFromArr.push("腾讯视频");
                 playUrlArr.push(episodeList.map(it => `${it.title}$${it.url}`).join("#"));
            }

            vod.vod_play_from = playFromArr.join("$$$");
            vod.vod_play_url = playUrlArr.join("$$$");

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
    
    const parseApi = "http://nm.4688888.xyz/nm_free.php?url=";
	const parseApi2 = "https://tt.666888.club/vip_parse.php?key=29f8f6fec2e6&url=";
    const targetUrl = parseApi + id; 

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

    if (pg > 1) return JSON.stringify({ list: [] });

    const link = `https://v.qq.com/x/search/?q=${encodeURIComponent(wd)}`;
    let videos = [];
    try {
        const html = await request(link);
        if (html) {
            let blocks = html.split('class="result_item');
            for (let i = 1; i < blocks.length; i++) {
                let block = blocks[i];
                
                let hrefM = block.match(/href="(https:\/\/v\.qq\.com\/x\/cover\/([^.]+)\.html)"/);
                if (hrefM) {
                    let id = hrefM[2];
                    
                    let titleM = block.match(/title="([^"]+)"/);
                    let name = titleM ? titleM[1].replace(/<\/?em>/g, "") : "";
                    
                    let picM = block.match(/src="([^"]+)"/);
                    let pic = picM ? picM[1] : "";
                    if(pic && pic.startsWith('//')) pic = 'https:' + pic;

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
        name: '🟢腾讯丨影视',
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