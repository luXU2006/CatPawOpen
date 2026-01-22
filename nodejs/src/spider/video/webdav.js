import req from '../../util/req.js';
import { ua, init as _init, detail as _detail, proxy, play } from '../../util/pan.js';

let SHARES_CONFIG = [];

const URL_GENERATORS = {
    'ali': (id) => `https://www.aliyundrive.com/s/${id}`,
    'quark': (id) => `https://pan.quark.cn/s/${id}`,
    'uc': (id) => `https://drive.uc.cn/s/${id}`,
    'baidu': (id, pwd) => `https://pan.baidu.com/s/${id}?pwd=${pwd || ''}`,
    '115': (id, pwd) => `https://115.com/s/${id}?password=${pwd || ''}`,
    '123': (id, pwd) => `https://www.123pan.com/s/${id}?pwd=${pwd || ''}`,
    'tianyi': (id) => `https://cloud.189.cn/t/${id}`,
    'yidong': (id) => `https://caiyun.139.com/m/i?${id}`,
    'tx': (id) => `https://cloud.189.cn/t/${id}`,
    'yd': (id) => `https://caiyun.139.com/m/i?${id}`,
};

const Utils = {
    generateShareUrl: (type, id, pwd) => {
        if (!type || !id) return "";

        if (type === '115' && id === 'self') {
            return `self115${id}`;
        }

        const generator = URL_GENERATORS[type.toLowerCase()];
        if (generator) {
            return generator(id, pwd);
        }

        if (id.length === 12) return URL_GENERATORS['quark'](id);
        if (id.length === 13) return URL_GENERATORS['uc'](id);
        
        return URL_GENERATORS['ali'](id);
    },

    formatVodId: (item) => {
        return `${item.share_id}*#${item.share_name}*#${item.share_type || ''}*#${item.share_pwd || ''}`;
    }
};

async function init(inReq, _outResp) {
    await _init(inReq, _outResp);
    
    try {
        if (inReq.server.config.webdav) {
            SHARES_CONFIG = inReq.server.config.webdav;
        } 
        else if (inReq.server.config.wpzyjh && inReq.server.config.wpzyjh.share) {
            SHARES_CONFIG = inReq.server.config.wpzyjh.share;
        }
    } catch (e) {
        console.error('Failed to load external config', e);
    }
    return {};
}

async function home(inReq, _outResp) {
    const classes = [];
    const filters = {};
    const addedIndices = new Set();

    SHARES_CONFIG.forEach((item) => {
        const indexName = item.share_index || "其他";
        if (!addedIndices.has(indexName)) {
            classes.push({ type_id: indexName, type_name: indexName });
            addedIndices.add(indexName);
            
            filters[indexName] = [
                {
                    key: 'order',
                    name: '排序',
                    value: [
                        { n: '默认', v: 'default' },
                        { n: '名称', v: 'name' }
                    ]
                }
            ];
        }
    });
    return { class: classes, filters: filters };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = parseInt(inReq.body.page) || 1;
    const limit = 20; 
    
    let allItems = SHARES_CONFIG.filter(item => (item.share_index || "其他") === tid);
    
    const total = allItems.length;
    const list = allItems.slice((pg - 1) * limit, pg * limit).map(item => ({
        vod_id: Utils.formatVodId(item),
        vod_name: item.share_name,
        vod_pic: getIconByShareType(item.share_type),
        vod_remarks: item.share_type ? `${item.share_type.toUpperCase()}` : (item.share_index || "资源")
    }));

    return { 
        list, 
        page: pg, 
        pagecount: Math.ceil(total / limit), 
        limit: limit, 
        total: total 
    };
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const parts = id.split('*#');
    const [shareId, shareName, shareType, sharePwd] = parts;

    const finalUrl = Utils.generateShareUrl(shareType, shareId, sharePwd);
    
    if (!finalUrl) {
        return { list: [] };
    }

    const vodFromPan = await _detail([finalUrl], inReq);

    if (vodFromPan && vodFromPan.urls) {
        return {
            list: [{
                vod_id: id,
                vod_name: shareName,
                vod_pic: getIconByShareType(shareType),
                type_name: shareType || "网盘",
                vod_year: new Date().getFullYear().toString(),
                vod_content: `资源名称：${shareName}\n网盘类型：${shareType || '自动识别'}\n原始链接：${finalUrl}`,
                vod_play_from: vodFromPan.froms,
                vod_play_url: vodFromPan.urls
            }]
        };
    }
    
    return { list: [] };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    const results = SHARES_CONFIG.filter(item => 
        item.share_name.includes(wd) || (item.share_index && item.share_index.includes(wd))
    ).map(item => ({
        vod_id: Utils.formatVodId(item),
        vod_name: `[${item.share_type || '盘'}] ${item.share_name}`,
        vod_pic: getIconByShareType(item.share_type),
        vod_remarks: item.share_index
    }));
    return { list: results };
}

function getIconByShareType(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('ali')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/ali.jpg";
    if (t.includes('quark')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/quark.png";
    if (t.includes('uc')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/uc.png";
    if (t.includes('baidu')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/baidu.jpg";
    if (t.includes('115')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/115.jpg";
    if (t.includes('123')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/123.png";
    if (t.includes('tianyi') || t.includes('tx')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/189.png";
    if (t.includes('yi') || t.includes('yd')) return "https://xget.xi-xu.me/gh/power721/alist-tvbox/raw/refs/heads/master/web-ui/public/139.jpg";
    return "https://img.picgo.net/2024/09/20/folder17188737527666f7f.png"; 
}

export default {
    meta: {
        key: 'webdav',
        name: '影视 ┃ 💿WebDav',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play); 
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy); 
    },
};