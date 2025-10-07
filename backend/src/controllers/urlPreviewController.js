const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const BlacklistedUrl = require('../models/BlacklistedUrl');
const ProxyUrl = require('../models/ProxyUrl');
const UserUrlPreviewSettings = require('../models/UserUrlPreviewSettings');
const { createHash } = require('crypto');
const NodeCache = require('node-cache');
const ipaddr = require('ipaddr.js');
const rateLimit = require('express-rate-limit');
const { URL } = require('url');
const validator = require('validator');
const xss = require('xss');
const net = require('net');

const previewCache = new NodeCache({
  stdTTL: 2592000, 
  checkperiod: 600, 
  useClones: false,
  maxKeys: 5000 
});

const CACHE_TTL = 3600000;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; 
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT = 10000; 
const MAX_URL_LENGTH = 2048; 

const PRIVATE_IP_RANGES = [
  {cidr: '10.0.0.0/8', desc: 'Mạng riêng nội bộ'},
  {cidr: '172.16.0.0/12', desc: 'Mạng riêng nội bộ'},
  {cidr: '192.168.0.0/16', desc: 'Mạng riêng nội bộ'},
  {cidr: '127.0.0.0/8', desc: 'Localhost'},
  {cidr: '169.254.0.0/16', desc: 'Link-local'},
  {cidr: '::1/128', desc: 'IPv6 Localhost'},
  {cidr: 'fe80::/10', desc: 'IPv6 Link-local'},
  {cidr: 'fc00::/7', desc: 'IPv6 Unique-local'}
];

const FORBIDDEN_TLDS = ['.local', '.localhost', '.internal', '.corp', '.home', '.lan'];

const agent = new https.Agent({
  rejectUnauthorized: true, 
  minVersion: 'TLSv1.2',   
  maxVersion: 'TLSv1.3',
  ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
  honorCipherOrder: true
});

const isPrivateIP = (hostname) => {
  try {
    if (!net.isIP(hostname)) return false;

    const ip = ipaddr.parse(hostname);
    const ipKind = ip.kind(); 
    
    if (ip.range() === 'loopback' || ip.range() === 'private' || ip.range() === 'linkLocal' || ip.range() === 'uniqueLocal') {
      return true;
    }

    for (const range of PRIVATE_IP_RANGES) {
      try {
        const cidr = ipaddr.parseCIDR(range.cidr);
        const cidrKind = cidr[0].kind();
        
        if (ipKind === cidrKind) {
          if (ip.match(cidr)) {
            return true;
          }
        }
      } catch (err) {
        console.error(`Lỗi kiểm tra dải IP ${range.cidr}:`, err);
      }
    }

    return false;
  } catch (error) {
    console.error('Lỗi kiểm tra IP:', error);
    return false; 
  }
};
const isUnsafeHostname = (hostname) => {
  if (!hostname) return true;
  hostname = hostname.toLowerCase();

  if (hostname === 'localhost') return true;
  if (FORBIDDEN_TLDS.some(tld => hostname.endsWith(tld))) return true;
  
  if (hostname === '::1' || hostname === '[::1]') return true;
  
  const dangerousKeywords = ['internal', 'intranet', 'corp', 'private', 'loc', 'intra'];
  if (dangerousKeywords.some(keyword => hostname.includes(keyword))) return true;
  
  return false;
};

const validateHostname = async (hostname) => {
  return new Promise((resolve) => {
    const before = Date.now();
    require('dns').resolve(hostname, (err, addresses) => {
      if (err) {
        console.error(`DNS resolution error for ${hostname}:`, err.message);
        return resolve(false);
      }
      
      for (const address of addresses) {
        if (isPrivateIP(address)) {
          console.log(`Phát hiện IP nội bộ ${address} cho hostname ${hostname}`);
          return resolve(false);
        }
      }
      
      const resolutionTime = Date.now() - before;
      if (resolutionTime < 5) {
        console.log(`Cảnh báo: Phân giải DNS quá nhanh (${resolutionTime}ms) cho ${hostname}`);
      }
      
      resolve(true);
    });
  });
};


const sanitizeAndValidateUrl = async (url) => {
  try {
    
    if (!url || typeof url !== 'string') {
      return { valid: false, message: 'URL không hợp lệ hoặc trống' };
    }

    
    if (url.length > MAX_URL_LENGTH) {
      return { valid: false, message: 'URL quá dài' };
    }

    
    const sanitizedUrl = url.trim();
    
    
    if (!validator.isURL(sanitizedUrl, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: true
    })) {
      return { valid: false, message: 'URL không đúng định dạng' };
    }

    try {
      const parsedUrl = new URL(sanitizedUrl);
      
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, message: 'Chỉ hỗ trợ giao thức HTTP và HTTPS' };
      }
      
      
      if (isUnsafeHostname(parsedUrl.hostname)) {
        return { 
          valid: false,
          message: 'Hostname không hợp lệ hoặc đã bị chặn' 
        };
      }
      
      
      if (isPrivateIP(parsedUrl.hostname)) {
        return { 
          valid: false, 
          message: 'Không được phép truy cập địa chỉ IP nội bộ' 
        };
      }

      
      const isHostnameValid = await validateHostname(parsedUrl.hostname);
      if (!isHostnameValid) {
        return {
          valid: false,
          message: 'Không thể xác minh hostname hoặc phát hiện DNS rebinding'
        };
      }
      
      return { valid: true, url: sanitizedUrl };
    } catch (error) {
      return { valid: false, message: `Định dạng URL không hợp lệ: ${error.message}` };
    }
  } catch (error) {
    console.error('Lỗi xác thực URL:', error);
    return { valid: false, message: 'Lỗi xác thực URL' };
  }
};


const urlPreviewRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 60, 
  message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
  headers: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const handleLinkedInUrl = async (url, skipFetch = false) => {

  try {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.hostname === 'linkedin.com' || 
        parsedUrl.hostname === 'www.linkedin.com' ||
        parsedUrl.hostname.endsWith('.linkedin.com')) {
      
      let username = '';
      const pathParts = parsedUrl.pathname.split('/');
      
      if (parsedUrl.pathname.includes('/in/')) {
        const inIndex = pathParts.indexOf('in');
        username = inIndex >= 0 && inIndex + 1 < pathParts.length ? pathParts[inIndex + 1] : '';
      } else if (parsedUrl.pathname.includes('/company/')) {
        const companyIndex = pathParts.indexOf('company');
        username = companyIndex >= 0 && companyIndex + 1 < pathParts.length ? pathParts[companyIndex + 1] : '';
      }
      
      let postTitle = null;
      let postDescription = null;
      
      if (!skipFetch && (parsedUrl.pathname.includes('/posts/') || parsedUrl.pathname.includes('/activity-'))) {
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0',
              'Accept': '*/*',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br, zstd',
              'Origin': 'https://www.linkedin.com',
              'Referer': 'https://www.linkedin.com/',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin',
              'Connection': 'keep-alive'
            },
            timeout: 5000,
            maxRedirects: 5
          });
          
          const $ = cheerio.load(response.data);
          
          postTitle = $('meta[property="og:title"]').attr('content') || null;
          postDescription = $('meta[property="og:description"]').attr('content') || null;
          
          if (postTitle) {
            username = username || postTitle.split(' on LinkedIn')[0];
          }
        } catch (fetchError) {
          console.log('LinkedIn post fetch error:', fetchError.message);
        }
      }
      
      return {
        title: postTitle || (username ? `${username} on LinkedIn` : 'LinkedIn'),
        description: postDescription || 'View this professional profile on LinkedIn',
        image: 'https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg',
        favicon: 'https://static.licdn.com/sc/h/2if24wp7oqlodqdlgei1n1520',
        siteName: 'LinkedIn',
        url: url,
        hostname: parsedUrl.hostname,
        author: username || null,
        publishedDate: null,
        hasVideo: false,
        isSpecialCase: true
      };
    }
    return null;
  } catch (error) {
    console.error('LinkedIn special case handling error:', error);
    return null;
  }
};

/*
const detectProxy = async (url, html) => {
  try {
    const parsedUrl = new URL(url);
    const proxySignals = [];

    const proxyKeywords = ['proxy', 'vpn', 'tunnel', 'gateway', 'anonymizer'];
    const hasProxyKeywords = proxyKeywords.some(keyword =>
      parsedUrl.hostname.toLowerCase().includes(keyword)
    );
    if (hasProxyKeywords) {
      proxySignals.push('URL contains proxy-related keywords');
    }

    if (parsedUrl.port && !['80', '443', ''].includes(parsedUrl.port)) {
      proxySignals.push('Unusual port detected');
    }

    if (html) {
      const $ = cheerio.load(html);
      
      $('meta').each((i, elem) => {
        const content = $(elem).attr('content') || '';
        if (proxyKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
          proxySignals.push('Proxy-related meta tags detected');
        }
      });

      $('script').each((i, elem) => {
        const src = $(elem).attr('src') || '';
        if (proxyKeywords.some(keyword => src.toLowerCase().includes(keyword))) {
          proxySignals.push('Proxy-related scripts detected');
        }
      });
    }

    if (proxySignals.length > 0) {
      const existingProxy = await ProxyUrl.findOne({ url: url });
      if (!existingProxy) {
        await ProxyUrl.create({
          url: url,
          detectionMethod: 'automated',
          confidence: Math.min(proxySignals.length * 25, 100),
          reason: proxySignals.join(', '),
          addedBy: null
        });
      }
      return { isProxy: true, reasons: proxySignals };
    }

    return { isProxy: false };
  } catch (error) {
    console.error('Proxy detection error:', error);
    return { isProxy: false };
  }
};
*/

const isUrlBlacklisted = async (url) => {
  try {
    const parsedUrl = new URL(url);
    
    const blacklistedUrls = await BlacklistedUrl.find();
    
    for (const blacklisted of blacklistedUrls) {
      try {
        if (blacklisted.url.startsWith('/') || blacklisted.url.includes('*') || 
            blacklisted.url.includes('\\') || blacklisted.url.includes('(')) {
          try {
            const pattern = new RegExp(blacklisted.url, 'i');
            if (pattern.test(url) || pattern.test(parsedUrl.hostname)) {
              return {
                isBlacklisted: true,
                reason: blacklisted.reason || 'This URL has been blacklisted by administrators.'
              };
            }
          } catch (regexError) {
            console.error(`Invalid regex pattern in blacklist: ${blacklisted.url}`, regexError);
          }
        } 
        else if (
          url === blacklisted.url || 
          parsedUrl.hostname === blacklisted.url ||
          parsedUrl.hostname.endsWith(`.${blacklisted.url}`) ||
          url.includes(blacklisted.url)
        ) {
          return {
            isBlacklisted: true,
            reason: blacklisted.reason || 'This URL has been blacklisted by administrators.'
          };
        }
      } catch (matchError) {
        console.error(`Error checking blacklist pattern: ${blacklisted.url}`, matchError);
      }
    }
    
    return { isBlacklisted: false };
  } catch (error) {
    console.error('Error checking blacklist:', error);
    return { isBlacklisted: false };
  }
};

exports.getPreviewSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = await UserUrlPreviewSettings.findOne({ userId });
    res.json(settings || { userId, globalPreviewEnabled: true, hiddenPreviews: [] });
  } catch (error) {
    console.error('Get Preview Settings Error:', error);
    res.status(500).json({ error: 'Failed to get preview settings' });
  }
};

exports.savePreviewSettings = async (req, res) => {
  try {
    const { globalPreviewEnabled } = req.body;
    if (typeof globalPreviewEnabled !== 'boolean') {
      return res.status(400).json({ error: 'globalPreviewEnabled must be a boolean' });
    }

    const userId = req.user._id;
    const settings = await UserUrlPreviewSettings.findOneAndUpdate(
      { userId },
      { globalPreviewEnabled },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    console.error('Save Preview Settings Error:', error);
    res.status(500).json({ error: 'Failed to save preview settings' });
  }
};

exports.hideUrlPreview = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const userId = req.user._id;
    const settings = await UserUrlPreviewSettings.findOneAndUpdate(
      { userId },
      { 
        $push: { 
          hiddenPreviews: { url, timestamp: new Date() }
        }
      },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    console.error('Hide URL Preview Error:', error);
    res.status(500).json({ error: 'Failed to hide URL preview' });
  }
};

exports.addBlacklistedUrl = async (req, res) => {
  try {
    const { url, reason } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const existing = await BlacklistedUrl.findOne({ url });
    if (existing) {
      return res.status(400).json({ error: 'URL is already blacklisted' });
    }

    const blacklistedUrl = new BlacklistedUrl({
      url,
      reason,
      addedBy: req.user._id
    });

    await blacklistedUrl.save();
    res.json(blacklistedUrl);
  } catch (error) {
    console.error('Add Blacklisted URL Error:', error);
    res.status(500).json({ error: 'Failed to blacklist URL' });
  }
};

exports.getBlacklistedUrls = async (req, res) => {
  try {
    const blacklistedUrls = await BlacklistedUrl.find()
      .populate('addedBy', 'name email')
      .sort('-createdAt');
    res.json(blacklistedUrls);
  } catch (error) {
    console.error('Get Blacklisted URLs Error:', error);
    res.status(500).json({ error: 'Failed to get blacklisted URLs' });
  }
};

exports.removeBlacklistedUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await BlacklistedUrl.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Blacklisted URL not found' });
    }
    
    res.json({ message: 'URL removed from blacklist' });
  } catch (error) {
    console.error('Remove Blacklisted URL Error:', error);
    res.status(500).json({ error: 'Failed to remove URL from blacklist' });
  }
};


const checkSSL = (url) => {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      
      if (!parsedUrl.protocol || !['https:', 'http:'].includes(parsedUrl.protocol)) {
        resolve({ valid: false, reason: 'Giao thức URL không hợp lệ' });
        return;
      }
      
      if (parsedUrl.protocol !== 'https:') {
        resolve({ valid: false, reason: 'Không sử dụng HTTPS' });
        return;
      }

      
      const trustedDomains = [
        
        'facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com',
        'instagram.com', 'www.instagram.com',
        'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
        'linkedin.com', 'www.linkedin.com',
        'tiktok.com', 'www.tiktok.com',
        'discord.com', 'www.discord.com', 'discordapp.com',
        'reddit.com', 'www.reddit.com',
        'pinterest.com', 'www.pinterest.com',
        'snapchat.com', 'www.snapchat.com',
        'telegram.org', 'www.telegram.org', 't.me',
        'whatsapp.com', 'www.whatsapp.com', 'web.whatsapp.com',
        
        
        'github.com', 'www.github.com', 'gist.github.com',
        'github.io', 'www.github.io', '*.github.io',
        'pages.github.com', 'github.dev', 'www.github.dev',
        'githubassets.com', 'www.githubassets.com',
        'githubusercontent.com', 'raw.githubusercontent.com',
        'stackoverflow.com', 'www.stackoverflow.com',
        'stackexchange.com', 'www.stackexchange.com',
        'gitlab.com', 'www.gitlab.com',
        'bitbucket.org', 'www.bitbucket.org',
        'codepen.io', 'www.codepen.io',
        'jsfiddle.net', 'www.jsfiddle.net',
        'npmjs.com', 'www.npmjs.com',
        'pypi.org', 'www.pypi.org',
        
        
        'google.com', 'www.google.com',
        'youtube.com', 'www.youtube.com', 'youtu.be',
        'gmail.com', 'www.gmail.com', 'mail.google.com',
        'drive.google.com', 'docs.google.com', 'sheets.google.com',
        'maps.google.com', 'translate.google.com',
        
        
        'microsoft.com', 'www.microsoft.com',
        'outlook.com', 'www.outlook.com', 'outlook.office.com',
        'office.com', 'www.office.com', 'office365.com',
        'onedrive.live.com', 'teams.microsoft.com',
        
        
        'apple.com', 'www.apple.com',
        'icloud.com', 'www.icloud.com',
        'support.apple.com', 'developer.apple.com',
        
        
        'amazon.com', 'www.amazon.com',
        'ebay.com', 'www.ebay.com',
        'shopee.vn', 'www.shopee.vn',
        'lazada.vn', 'www.lazada.vn',
        'tiki.vn', 'www.tiki.vn',
        'sendo.vn', 'www.sendo.vn',
        
        
        'netflix.com', 'www.netflix.com',
        'spotify.com', 'www.spotify.com', 'open.spotify.com',
        'twitch.tv', 'www.twitch.tv',
        'vimeo.com', 'www.vimeo.com',
        'soundcloud.com', 'www.soundcloud.com',
        'medium.com', 'www.medium.com',
        
        
        'wikipedia.org', 'www.wikipedia.org', 'en.wikipedia.org', 'vi.wikipedia.org',
        'bbc.com', 'www.bbc.com',
        'cnn.com', 'www.cnn.com',
        'reuters.com', 'www.reuters.com',
        'vnexpress.net', 'www.vnexpress.net',
        'tuoitre.vn', 'www.tuoitre.vn',
        'thanhnien.vn', 'www.thanhnien.vn',
        'dantri.com.vn', 'www.dantri.com.vn',
        
        
        'dropbox.com', 'www.dropbox.com',
        'box.com', 'www.box.com',
        'mega.nz', 'www.mega.nz',
        
        
        'figma.com', 'www.figma.com',
        'canva.com', 'www.canva.com',
        'notion.so', 'www.notion.so',
        'trello.com', 'www.trello.com',
        'slack.com', 'www.slack.com',
        'zoom.us', 'www.zoom.us',
        
        
        'coursera.org', 'www.coursera.org',
        'udemy.com', 'www.udemy.com',
        'edx.org', 'www.edx.org',
        'khanacademy.org', 'www.khanacademy.org',
        
        
        'paypal.com', 'www.paypal.com',
        'stripe.com', 'www.stripe.com',
        'vietcombank.com.vn', 'www.vietcombank.com.vn',
        'techcombank.com.vn', 'www.techcombank.com.vn',
        
        
        'zalo.me', 'www.zalo.me', 'chat.zalo.me',
        'zing.vn', 'www.zing.vn',
        'vtv.vn', 'www.vtv.vn',
        'vietnamnet.vn', 'www.vietnamnet.vn',
        'fpt.vn', 'www.fpt.vn',
        'vnpt.vn', 'www.vnpt.vn',
        '24h.com.vn', 'www.24h.com.vn',
        'kenh14.vn', 'www.kenh14.vn',
        'cafef.vn', 'www.cafef.vn',
        'baomoi.com', 'www.baomoi.com',
        
        
        'coinbase.com', 'www.coinbase.com',
        'binance.com', 'www.binance.com',
        'blockchain.com', 'www.blockchain.com',
        'coinmarketcap.com', 'www.coinmarketcap.com',
        'coingecko.com', 'www.coingecko.com',
        
        
        'hulu.com', 'www.hulu.com',
        'disneyplus.com', 'www.disneyplus.com', 'disney.com', 'www.disney.com',
        'hbo.com', 'www.hbo.com', 'hbomax.com', 'www.hbomax.com',
        'primevideo.com', 'www.primevideo.com',
        'crunchyroll.com', 'www.crunchyroll.com',
        'funimation.com', 'www.funimation.com',
        'dailymotion.com', 'www.dailymotion.com',
        
        
        'steam.com', 'www.steam.com', 'store.steampowered.com',
        'epicgames.com', 'www.epicgames.com', 'store.epicgames.com',
        'origin.com', 'www.origin.com',
        'battle.net', 'www.battle.net', 'blizzard.com', 'www.blizzard.com',
        'riotgames.com', 'www.riotgames.com',
        'ubisoft.com', 'www.ubisoft.com',
        'ea.com', 'www.ea.com',
        'nintendo.com', 'www.nintendo.com',
        'playstation.com', 'www.playstation.com',
        'xbox.com', 'www.xbox.com',
        'twitch.tv', 'www.twitch.tv',
        
        
        'asana.com', 'www.asana.com',
        'monday.com', 'www.monday.com',
        'atlassian.com', 'www.atlassian.com',
        'jira.atlassian.com', 'confluence.atlassian.com',
        'clickup.com', 'www.clickup.com',
        'basecamp.com', 'www.basecamp.com',
        'airtable.com', 'www.airtable.com',
        'miro.com', 'www.miro.com',
        'lucidchart.com', 'www.lucidchart.com',
        
        
        'adobe.com', 'www.adobe.com',
        'behance.net', 'www.behance.net',
        'dribbble.com', 'www.dribbble.com',
        'unsplash.com', 'www.unsplash.com',
        'pexels.com', 'www.pexels.com',
        'shutterstock.com', 'www.shutterstock.com',
        'gettyimages.com', 'www.gettyimages.com',
        
        
        'salesforce.com', 'www.salesforce.com',
        'hubspot.com', 'www.hubspot.com',
        'mailchimp.com', 'www.mailchimp.com',
        'calendly.com', 'www.calendly.com',
        'typeform.com', 'www.typeform.com',
        'surveymonkey.com', 'www.surveymonkey.com',
        'zendesk.com', 'www.zendesk.com',
        'intercom.com', 'www.intercom.com',
        
        
        'bing.com', 'www.bing.com',
        'duckduckgo.com', 'www.duckduckgo.com',
        'yahoo.com', 'www.yahoo.com',
        'yandex.com', 'www.yandex.com',
        'baidu.com', 'www.baidu.com',
        
        
        'booking.com', 'www.booking.com',
        'airbnb.com', 'www.airbnb.com',
        'expedia.com', 'www.expedia.com',
        'tripadvisor.com', 'www.tripadvisor.com',
        'agoda.com', 'www.agoda.com',
        'hotels.com', 'www.hotels.com',
        
        
        'uber.com', 'www.uber.com', 'ubereats.com', 'www.ubereats.com',
        'doordash.com', 'www.doordash.com',
        'grubhub.com', 'www.grubhub.com',
        'deliveroo.com', 'www.deliveroo.com',
        'foodpanda.com', 'www.foodpanda.com',
        'grab.com', 'www.grab.com',
        
        
        'fitbit.com', 'www.fitbit.com',
        'myfitnesspal.com', 'www.myfitnesspal.com',
        'strava.com', 'www.strava.com',
        'nike.com', 'www.nike.com',
        'adidas.com', 'www.adidas.com',
        
        
        'docs.microsoft.com', 'developer.mozilla.org',
        'w3schools.com', 'www.w3schools.com',
        'freecodecamp.org', 'www.freecodecamp.org',
        'codecademy.com', 'www.codecademy.com',
        'leetcode.com', 'www.leetcode.com',
        'hackerrank.com', 'www.hackerrank.com',
        'codepen.io', 'www.codepen.io',
        'replit.com', 'www.replit.com',
        
        
        'netlify.app', 'www.netlify.app', '*.netlify.app',
        'vercel.app', 'www.vercel.app', '*.vercel.app',
        'surge.sh', 'www.surge.sh', '*.surge.sh',
        'herokuapp.com', 'www.herokuapp.com', '*.herokuapp.com',
        'firebase.app', 'www.firebase.app', '*.firebase.app',
        'firebaseapp.com', 'www.firebaseapp.com', '*.firebaseapp.com',
        'glitch.me', 'www.glitch.me', '*.glitch.me',
        'codesandbox.io', 'www.codesandbox.io', '*.codesandbox.io',
        'stackblitz.com', 'www.stackblitz.com', '*.stackblitz.com',
        'gitpod.io', 'www.gitpod.io', '*.gitpod.io',
        
        
        'protonmail.com', 'www.protonmail.com',
        'tutanota.com', 'www.tutanota.com',
        'signal.org', 'www.signal.org',
        'viber.com', 'www.viber.com',
        'skype.com', 'www.skype.com',
        
        
        'weather.com', 'www.weather.com',
        'accuweather.com', 'www.accuweather.com',
        'openstreetmap.org', 'www.openstreetmap.org',
        'waze.com', 'www.waze.com',
        
        
        'quora.com', 'www.quora.com',
        '9gag.com', 'www.9gag.com',
        'imgur.com', 'www.imgur.com',
        'flickr.com', 'www.flickr.com',
        'tumblr.com', 'www.tumblr.com',
        'mastodon.social', 'mastodon.online',
        
        
        'iuptit.com','cms.iuptit.com','daily.dev',
        'techysnoop.com'
      ];
      
      
      const isTrustedDomain = trustedDomains.some(domain => {
        return parsedUrl.hostname === domain || 
               parsedUrl.hostname.endsWith('.' + domain);
      });
      
      
      const staticHostingPlatforms = [
        'github.io', 'netlify.app', 'vercel.app', 'surge.sh', 
        'herokuapp.com', 'firebase.app', 'firebaseapp.com', 
        'glitch.me', 'codesandbox.io', 'stackblitz.com', 'gitpod.io'
      ];
      
      const isStaticHosting = staticHostingPlatforms.some(platform => 
        parsedUrl.hostname.endsWith('.' + platform) || parsedUrl.hostname === platform
      );
      
      if (isTrustedDomain || isStaticHosting) {
        
        const req = https.request({
          method: 'HEAD',
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          path: parsedUrl.pathname + parsedUrl.search,
          timeout: 8000,
          agent: new https.Agent({
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
          }),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SecurityChecker/1.0)',
            'Accept': '*/*'
          }
        }, (res) => {
          if (res.socket && res.socket.authorized) {
            resolve({ valid: true });
          } else {
            resolve({ 
              valid: true, 
              warning: 'Không thể xác minh đầy đủ chứng chỉ SSL nhưng tên miền nằm trong danh sách đáng tin cậy'
            });
          }
          res.destroy(); 
        });

        req.on('error', (error) => {
          console.error(`Lỗi kiểm tra SSL cho tên miền tin cậy ${parsedUrl.hostname}:`, error.message);
          resolve({ 
            valid: true, 
            warning: 'Không thể kiểm tra đầy đủ chứng chỉ SSL nhưng tên miền nằm trong danh sách đáng tin cậy' 
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ 
            valid: true, 
            warning: 'Kiểm tra SSL đã hết thời gian nhưng tên miền nằm trong danh sách đáng tin cậy' 
          });
        });

        req.end();
        return;
      }

      
      const req = https.request({
        method: 'HEAD',
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        timeout: 5000,
        agent: new https.Agent({
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2'
        })
      }, (res) => {
        if (res.socket && res.socket.getPeerCertificate) {
          const cert = res.socket.getPeerCertificate(true);
          const currentDate = new Date();
          
          if (res.socket.authorized) {
            if (cert.valid_to) {
              try {
                const expirationDate = new Date(cert.valid_to);
                
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                if (expirationDate - currentDate < thirtyDaysInMs) {
                  resolve({ 
                    valid: true, 
                    warning: `Chứng chỉ SSL sẽ sớm hết hạn (${expirationDate.toLocaleDateString()})` 
                  });
                  res.destroy();
                  return;
                }
              } catch (dateError) {
                console.error('Lỗi xử lý ngày chứng chỉ:', dateError);
              }
            }
            
            
            if (cert.issuerCertificate) {
              
              const checkIssuerChain = (issuerCert, depth = 0) => {
                
                if (!issuerCert || depth > 10) return true;
                
                const untrustedCAs = ['WoSign', 'StartCom', 'CNNIC'];
                
                if (issuerCert.issuer) {
                  let issuerStr = '';
                  try {
                    
                    issuerStr = typeof issuerCert.issuer === 'object' ? 
                      Object.entries(issuerCert.issuer).map(([k, v]) => `${k}=${v}`).join(',') : 
                      String(issuerCert.issuer);
                    
                    if (untrustedCAs.some(ca => issuerStr.includes(ca))) {
                      return false;
                    }
                  } catch (err) {
                    console.error('Error processing certificate issuer:', err.message);
                  }
                }
                
                
                if (issuerCert.issuerCertificate && 
                    issuerCert.issuerCertificate !== issuerCert) {
                  return checkIssuerChain(issuerCert.issuerCertificate, depth + 1);
                }
                
                return true;
              };
              
              if (!checkIssuerChain(cert.issuerCertificate)) {
                resolve({ 
                  valid: false, 
                  reason: 'Chứng chỉ SSL được cấp bởi CA không được tin cậy' 
                });
                res.destroy();
                return;
              }
            }
            
            if (!cert.issuer) {
              resolve({ valid: false, reason: 'Không thể xác minh nhà phát hành chứng chỉ' });
              res.destroy();
              return;
            }
            
            resolve({ valid: true });
          } else {
            resolve({ valid: false, reason: 'Chứng chỉ SSL không hợp lệ' });
          }
        } else {
          resolve({ valid: false, reason: 'Không thể xác minh chứng chỉ SSL' });
        }
        res.destroy();
      });

      req.on('error', (error) => {
        resolve({ valid: false, reason: `Chứng chỉ SSL xác thực không thành công: ${error.message}` });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ valid: false, reason: 'Kiểm tra SSL đã hết thời gian' });
      });

      req.end();
    } catch (error) {
      resolve({ valid: false, reason: `URL sai: ${error.message}` });
    }
  });
};


const checkMaliciousContent = (url, html) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    
    
    const trustedDomains = [
      
      'youtube.com', 'www.youtube.com', 'youtu.be',
      'vimeo.com', 'www.vimeo.com',
      'netflix.com', 'www.netflix.com',
      'twitch.tv', 'www.twitch.tv',
      'tiktok.com', 'www.tiktok.com',
      
      
      'facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com',
      'instagram.com', 'www.instagram.com',
      'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
      'linkedin.com', 'www.linkedin.com',
      'reddit.com', 'www.reddit.com',
      'pinterest.com', 'www.pinterest.com',
      'discord.com', 'www.discord.com',
      
      
      'google.com', 'www.google.com',
      'microsoft.com', 'www.microsoft.com',
      'apple.com', 'www.apple.com',
      'amazon.com', 'www.amazon.com',
      'github.com', 'www.github.com',
      'stackoverflow.com', 'www.stackoverflow.com',
      'wikipedia.org', 'www.wikipedia.org', 'en.wikipedia.org', 'vi.wikipedia.org',
      
      
      'bbc.com', 'www.bbc.com',
      'cnn.com', 'www.cnn.com',
      'reuters.com', 'www.reuters.com',
      'vnexpress.net', 'www.vnexpress.net',
      'tuoitre.vn', 'www.tuoitre.vn',
      'thanhnien.vn', 'www.thanhnien.vn',
      '24h.com.vn', 'www.24h.com.vn',
      'kenh14.vn', 'www.kenh14.vn',
      'baomoi.com', 'www.baomoi.com',
      
      
      'steam.com', 'www.steam.com', 'store.steampowered.com',
      'epicgames.com', 'www.epicgames.com',
      'riotgames.com', 'www.riotgames.com',
      
      
      'freecodecamp.org', 'www.freecodecamp.org',
      'w3schools.com', 'www.w3schools.com',
      'developer.mozilla.org', 'docs.microsoft.com',
      
      
      'iuptit.com', 'cms.iuptit.com', 'daily.dev', 'techysnoop.com'
    ];
    
    
    const staticHostingPlatforms = [
      'github.io', 'netlify.app', 'vercel.app', 'surge.sh', 
      'herokuapp.com', 'firebase.app', 'firebaseapp.com', 
      'glitch.me', 'codesandbox.io', 'stackblitz.com', 'gitpod.io'
    ];
    
    const isStaticHosting = staticHostingPlatforms.some(platform => 
      hostname.endsWith('.' + platform) || hostname === platform
    );
    
    if (trustedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain)) || isStaticHosting) {
      return []; 
    }
  } catch (error) {
    console.error('Lỗi phân tích URL trong kiểm tra nội dung độc hại:', error);
  }
  
  const signals = [];
  
  
  if ((html.includes('password') || html.includes('mật khẩu')) && 
      (html.includes('login') || html.includes('đăng nhập')) && 
      (html.includes('credit card') || html.includes('thẻ tín dụng')) && 
      (html.includes('submit') || html.includes('gửi'))) {
    signals.push('Phát hiện trang lừa đảo tiềm năng');
  }
  
  
  const maliciousJSPatterns = [
    'eval(', 
    'document.write(escape(', 
    'String.fromCharCode(', 
    'unescape(', 
    'function(p,a,c,k,e,r)', 
    '.join("")',
    'fromCharCode',
    'window.location=',
    'top.location=',
    'document.cookie',
    'document.write(unescape'
  ];
  
  if (maliciousJSPatterns.some(pattern => html.includes(pattern))) {
    signals.push('Phát hiện JavaScript độc hại tiềm năng');
  }
  
  
  if (html.includes('<iframe') && 
     (html.includes('width="0"') || html.includes('height="0"') || 
      html.includes('display:none') || html.includes('visibility:hidden') ||
      html.includes('opacity:0') || html.includes('position:absolute;left:-'))) {
    signals.push('Phát hiện iframe ẩn');
  }
  
  
  if (html.includes('window.location.replace') || 
      html.includes('window.location.href') || 
      html.includes('window.navigate') ||
      html.includes('top.location.href')) {
    signals.push('Phát hiện chuyển hướng đáng ngờ');
  }

  
  if (html.includes('new Image().src=') ||
      html.includes('.src="http') && html.includes('cookie')) {
    signals.push('Phát hiện gửi dữ liệu ra ngoài tiềm năng');
  }
  
  
  const xssPatterns = ['<script>alert', 'prompt(', 'confirm(', 'onerror=', 'onload=', 'javascript:alert'];
  if (xssPatterns.some(pattern => html.includes(pattern))) {
    signals.push('Phát hiện mẫu tấn công XSS tiềm năng');
  }

  return signals;
};

const extractMetadata = ($, url) => {
  try {
    const parsedUrl = new URL(url);
    
    const title = 
      $('meta[property="og:title"]').attr('content') || 
      $('meta[name="twitter:title"]').attr('content') ||
      $('meta[name="title"]').attr('content') ||
      $('title').first().text() ||
      $('h1').first().text() ||
      $('h2').first().text() ||
      parsedUrl.hostname;
    
    let description = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[itemprop="description"]').attr('content');
    
    if (!description) {
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 25 && !description) {
          description = text;
        }
      });
    }
    
    if (description && description.length > 300) {
      description = description.substring(0, 297) + '...';
    }
    
    let image = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[itemprop="image"]').attr('content');
    
    if (!image) {
      const images = [];
      
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        const width = parseInt($(el).attr('width') || '0');
        const height = parseInt($(el).attr('height') || '0');
        const alt = $(el).attr('alt') || '';
        
        if (src && (width > 100 || height > 100 || (!width && !height)) && !src.includes('data:image')) {
          images.push({
            src,
            area: width * height || 10000, 
            alt
          });
        }
      });
      
      if (images.length > 0) {
        images.sort((a, b) => b.area - a.area);
        image = images[0].src;
      }
    }
    
    if (image && !image.startsWith('http')) {
      image = new URL(image, url).toString();
    }
    
    let favicon = 
      $('link[rel="apple-touch-icon"]').attr('href') ||
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href');
    
    if (!favicon) {
      favicon = `/favicon.ico`;
    }
    
    if (favicon && !favicon.startsWith('http')) {
      favicon = new URL(favicon, url).toString();
    }
    
    const siteName = 
      $('meta[property="og:site_name"]').attr('content') ||
      $('meta[name="application-name"]').attr('content') ||
      parsedUrl.hostname.replace(/^www\./, '');
    
    const author = 
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      null;
    
    let publishedDate = 
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="date"]').attr('content') ||
      null;
    
    if (publishedDate) {
      try {
        publishedDate = new Date(publishedDate).toISOString();
      } catch (e) {
        publishedDate = null;
      }
    }
    
    const hasVideo = 
      $('meta[property="og:video"]').attr('content') || 
      $('video').length > 0 || 
      $('iframe[src*="youtube.com"]').length > 0 ||
      $('iframe[src*="vimeo.com"]').length > 0;
    
    return {
      title: title ? title.trim() : '',
      description: description ? description.trim() : '',
      image,
      favicon,
      siteName: siteName.trim(),
      url,
      hostname: parsedUrl.hostname,
      author,
      publishedDate,
      hasVideo: Boolean(hasVideo)
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return { title: '', description: '', image: '', siteName: '', url };
  }
};

exports.checkUrl = async (req, res) => {
  try {
    const { url } = req.query;
    console.log('Kiểm tra URL:', url);
    
    const validation = await sanitizeAndValidateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        type: 'url',
        message: validation.message
      });
    }
    
    const sanitizedUrl = validation.url;

    const blacklistCheck = await isUrlBlacklisted(sanitizedUrl);
    if (blacklistCheck.isBlacklisted) {
      console.log(`Kiểm tra URL - bị chặn: ${sanitizedUrl} (blacklist)`);
      return res.status(403).json({
        type: 'blacklist',
        message: blacklistCheck.reason,
        blocked: true
      });
    }

    const [sslCheck, proxyCheck] = await Promise.all([
      checkSSL(sanitizedUrl),
      ProxyUrl.findOne({
        url: { $regex: new URL(sanitizedUrl).hostname, $options: 'i' },
        status: 'active'
      })
    ]);

    if (proxyCheck) {
      console.log(`Kiểm tra URL - bị chặn: ${sanitizedUrl} (proxy)`);
      return res.status(403).json({
        type: 'proxy',
        message: 'URL này đã được xác định là dịch vụ proxy',
        details: proxyCheck.reason
      });
    }

    if (!sslCheck.valid) {
      console.log(`Kiểm tra URL - bị chặn: ${sanitizedUrl} (SSL không hợp lệ)`);
      return res.status(403).json({
        type: 'ssl',
        message: sslCheck.reason
      });
    }

    console.log(`Kiểm tra URL - thành công: ${sanitizedUrl}`);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Lỗi kiểm tra URL:', error);
    return res.status(500).json({ 
      error: 'Kiểm tra thất bại',
      message: error.message 
    });
  }
};

exports.getUrlPreview = async (req, res) => {
  try {
    const { url, nocache } = req.query;
    
    const validation = await sanitizeAndValidateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'URL không hợp lệ',
        message: validation.message
      });
    }
    
    const sanitizedUrl = validation.url;
    let isLinkedIn = false;

    try {
      const parsedUrl = new URL(sanitizedUrl);
      isLinkedIn = parsedUrl.hostname === 'linkedin.com' || 
                   parsedUrl.hostname === 'www.linkedin.com' ||
                   parsedUrl.hostname.endsWith('.linkedin.com');
    } catch (error) {
      console.error('Lỗi phân tích URL:', error);
      return res.status(400).json({ 
        error: 'Định dạng URL không hợp lệ',
        message: error.message
      });
    }
    
    const [blacklistCheck, sslCheck, proxyCheck] = await Promise.all([
      isUrlBlacklisted(sanitizedUrl),
      checkSSL(sanitizedUrl),
      ProxyUrl.findOne({
        url: { $regex: new URL(sanitizedUrl).hostname, $options: 'i' },
        status: 'active'
      })
    ]);

    if (proxyCheck) {
      return res.json({
        warning: true,
        type: 'proxy',
        message: 'URL này đã được xác định là dịch vụ proxy',
        details: proxyCheck.reason,
        url: sanitizedUrl,
        siteName: new URL(sanitizedUrl).hostname,
        title: sanitizedUrl,
        hostname: new URL(sanitizedUrl).hostname
      });
    }

    if (blacklistCheck.isBlacklisted) {
      console.log(`Đã chặn - URL trong blacklist: ${sanitizedUrl}`);
      return res.json({
        warning: true,
        type: 'blacklist',
        message: 'URL này đã bị quản trị viên đưa vào danh sách đen',
        url: sanitizedUrl,
        siteName: new URL(sanitizedUrl).hostname,
        title: sanitizedUrl,
        hostname: new URL(sanitizedUrl).hostname,
        blocked: true  
      });
    }

    if (!sslCheck.valid) {
      console.log(`Cảnh báo - SSL không hợp lệ: ${sanitizedUrl}`);
      return res.json({
        warning: true,
        type: 'ssl',
        message: sslCheck.reason || 'Xác thực SSL thất bại',
        url: sanitizedUrl,
        siteName: new URL(sanitizedUrl).hostname,
        title: sanitizedUrl,
        hostname: new URL(sanitizedUrl).hostname
      });
    }

    
    if (isLinkedIn) {
      const linkedInPreview = await handleLinkedInUrl(sanitizedUrl, blacklistCheck.isBlacklisted);
      if (linkedInPreview) {
        return res.json(linkedInPreview);
      }
    }

    
    const cacheKey = createHash('md5').update(sanitizedUrl).digest('hex');
    if (!nocache && previewCache.has(cacheKey)) {
      const cachedData = previewCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        return res.json(cachedData.data);
      } else {
        previewCache.del(cacheKey);
      }
    }

    
    const userId = req.user?._id;
    if (userId) {
      const settings = await UserUrlPreviewSettings.findOne({ userId });
      if (settings) {
        const isHidden = settings.hiddenPreviews.some(p => p.url === sanitizedUrl);
        if (isHidden || !settings.globalPreviewEnabled) {
          return res.json({ hidden: true });
        }
      }
    }
    
    
    const axiosConfig = {
      timeout: REQUEST_TIMEOUT,
      maxContentLength: MAX_RESPONSE_SIZE,
      maxRedirects: MAX_REDIRECTS,
      responseType: 'arraybuffer',
      validateStatus: status => status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ClubManageBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Mode': 'navigate',
        'DNT': '1'
      }
    };

    
    let response;

    
    console.log('Thực hiện kết nối trực tiếp do không sử dụng proxy hoặc proxy thất bại');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT); 

    try {
      response = await axios.get(sanitizedUrl, {
        ...axiosConfig,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error('Lỗi fetch trực tiếp:', error.message);
      throw error; 
    }

    
    const decompress = (responseObj) => {
      const encoding = responseObj.headers['content-encoding'];
      if (!encoding) return responseObj.data;
      const zlib = require('zlib');
      switch (encoding.toLowerCase()) {
        case 'gzip':
          return zlib.gunzipSync(responseObj.data);
        case 'deflate':
          return zlib.inflateSync(responseObj.data);
        case 'br':
          return zlib.brotliDecompressSync(responseObj.data);
        default:
          return responseObj.data;
      }
    };

    
    if (sanitizedUrl.startsWith('https://')) {
      try {
        if (response.request && 
            response.request.res && 
            response.request.res.socket && 
            response.request.res.socket.authorized === false) {
          return res.json({
            warning: true,
            type: 'ssl',
            message: 'Website này có chứng chỉ SSL không hợp lệ.'
          });
        }
      } catch (sslCheckError) {
        console.log('Lỗi kiểm tra SSL:', sslCheckError.message);
      }
    }

    
    const normalizeCharset = (charset) => {
      charset = charset.toLowerCase().replace(/['"]/g, '').trim();
      
      const charsetMap = {
        'iso-8859-1': 'windows-1252',
        'latin1': 'windows-1252',
        'us-ascii': 'windows-1252',
        'iso-8859-2': 'windows-1250',
        'iso-8859-15': 'windows-1252',
        'gb2312': 'gbk',
      };
      
      return charsetMap[charset] || charset;
    };

    // Xử lý content-type
    const contentType = response.headers['content-type'] || '';
    let charset = 'utf-8';
    const charsetMatch = contentType.match(/charset=([^;]+)/i);
    if (charsetMatch) {
      charset = normalizeCharset(charsetMatch[1]);
    }

    // Kiểm tra loại nội dung
    if (!contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml') &&
        !contentType.includes('application/xml')) {
      return res.status(415).json({
        error: 'URL không chứa nội dung HTML',
        contentType
      });
    }
    
    // Giải mã nội dung
    let decodedData;
    try {
      const decompressedData = decompress(response);
      decodedData = new TextDecoder(charset).decode(decompressedData);
    } catch (decodeError) {
      console.error('Lỗi giải mã nội dung:', decodeError);
      decodedData = new TextDecoder('utf-8').decode(decompress(response));
    }

    // Kiểm tra nội dung HTML hợp lệ
    if (!decodedData.includes('<html') && !decodedData.includes('<body')) {
      return res.status(415).json({
        error: 'Nội dung HTML không hợp lệ',
        snippet: decodedData.substring(0, 100) 
      });
    }

    // Parse HTML với Cheerio
    const $ = cheerio.load(decodedData, {
      decodeEntities: true,
      normalizeWhitespace: true,
      xmlMode: false
    });
    
    // Kiểm tra nội dung độc hại
    const maliciousSignals = checkMaliciousContent(sanitizedUrl, decodedData);
    if (maliciousSignals.length > 0) {
      return res.status(403).json({
        warning: true,
        type: 'security',
        message: 'Đã phát hiện nội dung có khả năng không an toàn',
        details: maliciousSignals
      });
    }

    // Trích xuất metadata
    const metadata = extractMetadata($, sanitizedUrl);
    
    // Bảo vệ khỏi XSS trong metadata
    Object.keys(metadata).forEach(key => {
      if (typeof metadata[key] === 'string') {
        metadata[key] = xss(metadata[key]);
      }
    });
    
    // Lưu vào cache
    previewCache.set(cacheKey, {
      timestamp: Date.now(),
      data: metadata,
      charset: charset
    });

    return res.json(metadata);

  } catch (fetchError) {
    if (typeof timeoutId !== 'undefined') {
      clearTimeout(timeoutId);
    }
    
    // Xử lý các lỗi cụ thể
    if (fetchError.code === 'ECONNABORTED' || fetchError.name === 'AbortError') {
      return res.status(408).json({ error: 'Hết thời gian yêu cầu khi lấy URL' });
    }
    
    if (fetchError.response) {
      return res.status(fetchError.response.status).json({
        error: `Máy chủ phản hồi với mã trạng thái: ${fetchError.response.status}`,
        message: fetchError.message
      });
    }
    
    if (fetchError.code === 'CERT_HAS_EXPIRED' || fetchError.code === 'CERT_NOT_YET_VALID') {
      return res.json({
        warning: true,
        type: 'ssl',
        message: 'Website này có chứng chỉ SSL đã hết hạn.'
      });
    }
    
    return res.status(500).json({ 
      error: 'Không thể lấy xem trước URL',
      message: fetchError.message 
    });
  }
};

// Thiết lập rate limit cho các endpoint
exports.urlPreviewRateLimit = urlPreviewRateLimit;

exports.getProxyUrls = async (req, res) => {
  try {
    const proxyUrls = await ProxyUrl.find()
      .populate('addedBy', 'name email')
      .sort('-createdAt');

    const proxiesWithStats = proxyUrls.map(proxy => {
      const totalRequests = proxy.successCount + proxy.failureCount;
      const successRate = totalRequests > 0 ?
        (proxy.successCount / totalRequests) * 100 : 0;
      
      let healthScore = 0;
      healthScore += successRate * 0.4; 
      healthScore += (100 - (proxy.timeoutCount * 10)) * 0.3; 
      healthScore += proxy.confidence * 0.3; 
      healthScore = Math.max(0, Math.min(100, healthScore));

      let healthStatus = 'unknown';
      if (healthScore >= 80) healthStatus = 'healthy';
      else if (healthScore >= 50) healthStatus = 'warning';
      else healthStatus = 'unhealthy';

      const healthDetails = [];
      if (proxy.timeoutCount > 3) {
        healthDetails.push('High timeout rate');
      }
      if (successRate < 50) {
        healthDetails.push('Low success rate');
      }
      if (proxy.confidence < 50) {
        healthDetails.push('Low confidence score');
      }
      if (proxy.failureCount > 5) {
        healthDetails.push('High failure rate');
      }

      return {
        ...proxy.toObject(),
        metrics: {
          successRate: Math.round(successRate),
          totalRequests,
          timeoutRate: totalRequests > 0 ?
            Math.round((proxy.timeoutCount / totalRequests) * 100) : 0,
          averageResponseTime: Math.round(proxy.averageResponseTime || 0),
          health: {
            score: Math.round(healthScore),
            status: healthStatus,
            details: healthDetails
          }
        }
      };
    });

    res.json(proxiesWithStats);
  } catch (error) {
    console.error('Get Proxy URLs Error:', error);
    res.status(500).json({ error: 'Failed to get proxy URLs' });
  }
};

exports.getProxyHealth = async (req, res) => {
  try {
    const { id } = req.params;
    const proxy = await ProxyUrl.findById(id);
    
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }

    const totalRequests = proxy.successCount + proxy.failureCount;
    const successRate = totalRequests > 0 ?
      (proxy.successCount / totalRequests) * 100 : 0;

    const healthReport = {
      url: proxy.url,
      status: proxy.status,
      metrics: {
        totalRequests,
        successCount: proxy.successCount,
        failureCount: proxy.failureCount,
        timeoutCount: proxy.timeoutCount,
        successRate: Math.round(successRate),
        timeoutRate: totalRequests > 0 ?
          Math.round((proxy.timeoutCount / totalRequests) * 100) : 0,
        averageResponseTime: Math.round(proxy.averageResponseTime || 0)
      },
      confidence: proxy.confidence,
      lastChecked: proxy.lastChecked,
      lastFailureReason: proxy.lastFailureReason,
      detectionMethod: proxy.detectionMethod,
      history: {
        lastDayRequests: 0, 
        lastWeekRequests: 0,
        lastMonthRequests: 0
      },
      recommendations: []
    };

    if (proxy.timeoutCount > 3) {
      healthReport.recommendations.push('Consider increasing timeout threshold or removing proxy');
    }
    if (successRate < 50) {
      healthReport.recommendations.push('Proxy showing poor performance, consider replacing');
    }
    if (proxy.averageResponseTime > 5000) {
      healthReport.recommendations.push('High latency detected, consider faster alternatives');
    }

    res.json(healthReport);
  } catch (error) {
    console.error('Get Proxy Health Error:', error);
    res.status(500).json({ error: 'Failed to get proxy health metrics' });
  }
};

exports.addProxyUrlsBulk = async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || typeof urls !== 'string') {
      return res.status(400).json({ error: 'URLs list is required as a string' });
    }

    const proxyList = urls.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const results = {
      added: [],
      skipped: [],
      errors: []
    };

    for (const url of proxyList) {
      try {
        try {
          new URL(url);
        } catch (e) {
          results.errors.push({ url, error: 'Invalid URL format' });
          continue;
        }

        const existing = await ProxyUrl.findOne({ url });
        if (existing) {
          results.skipped.push({ url, reason: 'Already exists' });
          continue;
        }

        const proxyUrl = new ProxyUrl({
          url,
          reason: 'Bulk import',
          confidence: 50,
          detectionMethod: 'manual',
          addedBy: req.user._id,
          timeoutCount: 0,
          successCount: 0,
          failureCount: 0,
          averageResponseTime: 0
        });

        await proxyUrl.save();
        results.added.push({ url, id: proxyUrl._id }); 
      } catch (err) {
        results.errors.push({ url, error: err.message });
      }
    }

    let testResults = null;
    if (results.added.length > 0 && req.query.testImmediately === 'true') {
      try {
        
        const proxiesToTest = await ProxyUrl.find({
          _id: { $in: results.added.map(item => item.id) }
        });
        
        const testData = {
          total: proxiesToTest.length,
          working: 0,
          failed: 0,
          details: []
        };

        const testUrl = 'https://www.google.com';
        
        for (const proxy of proxiesToTest) {
          try {
            const startTime = Date.now();
            await axios.get(testUrl, {
              proxy: {
                host: new URL(proxy.url).hostname,
                port: new URL(proxy.url).port || 80,
                protocol: new URL(proxy.url).protocol.replace(':', '')
              },
              timeout: 10000,
              validateStatus: status => status < 400
            });

            const responseTime = Date.now() - startTime;

            await ProxyUrl.findByIdAndUpdate(proxy._id, {
              status: 'active',
              lastChecked: new Date(),
              $inc: { successCount: 1 },
              averageResponseTime: responseTime
            });

            testData.working++;
            testData.details.push({
              url: proxy.url,
              status: 'active',
              responseTime
            });
          } catch (error) {
            await ProxyUrl.findByIdAndUpdate(proxy._id, {
              status: 'inactive',
              lastChecked: new Date(),
              $inc: { failureCount: 1 },
              lastFailureReason: error.message || 'Unknown error'
            });

            testData.failed++;
            testData.details.push({
              url: proxy.url,
              status: 'inactive',
              error: error.message
            });
          }
        }
        
        testResults = testData;
      } catch (error) {
        console.error('Auto-test error:', error);
      }
    }

    return res.json({
      message: 'Bulk import completed',
      summary: {
        total: proxyList.length,
        added: {
          count: results.added.length,
          items: results.added
        },
        skipped: {
          count: results.skipped.length,
          items: results.skipped
        },
        errors: {
          count: results.errors.length,
          items: results.errors
        }
      },
      testResults
    });
  } catch (error) {
    console.error('Bulk Add Proxy URLs Error:', error);
    return res.status(500).json({ error: 'Failed to process proxy URLs' });
  }
};

exports.testProxies = async (req, res) => {
  try {
    const { proxyIds } = req.body;
    const testUrl = 'https://www.google.com'; 
    
    let proxiesToTest;
    if (proxyIds && Array.isArray(proxyIds)) {
      proxiesToTest = await ProxyUrl.find({ _id: { $in: proxyIds } });
    } else {
      proxiesToTest = await ProxyUrl.find({
        $or: [
          { status: 'pending' },
          { status: 'inactive', lastChecked: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      });
    }

    const results = {
      total: proxiesToTest.length,
      working: 0,
      failed: 0,
      details: []
    };

    for (const proxy of proxiesToTest) {
      try {
        const startTime = Date.now();
        await axios.get(testUrl, {
          proxy: {
            host: new URL(proxy.url).hostname,
            port: new URL(proxy.url).port || 80,
            protocol: new URL(proxy.url).protocol.replace(':', '')
          },
          timeout: 10000,
          validateStatus: status => status < 400
        });

        const responseTime = Date.now() - startTime;

        await ProxyUrl.findByIdAndUpdate(proxy._id, {
          status: 'active',
          lastChecked: new Date(),
          $inc: { successCount: 1 },
          averageResponseTime: responseTime
        });

        results.working++;
        results.details.push({
          url: proxy.url,
          status: 'active',
          responseTime
        });
      } catch (error) {
        await ProxyUrl.findByIdAndUpdate(proxy._id, {
          status: 'inactive',
          lastChecked: new Date(),
          $inc: { failureCount: 1 },
          lastFailureReason: error.message || 'Unknown error'
        });

        results.failed++;
        results.details.push({
          url: proxy.url,
          status: 'inactive',
          error: error.message
        });
      }
    }

    if (req.query.autoRemove === 'true') {
      const failedUrls = results.details
        .filter(d => d.status === 'inactive')
        .map(d => d.url);
      
      if (failedUrls.length > 0) {
        await ProxyUrl.deleteMany({ url: { $in: failedUrls } });
        results.removedCount = failedUrls.length;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Test Proxies Error:', error);
    res.status(500).json({ error: 'Failed to test proxies' });
  }
};

exports.addProxyUrl = async (req, res) => {
  try {
    const { url, reason, confidence } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    if (confidence && (confidence < 0 || confidence > 100)) {
      return res.status(400).json({ error: 'Confidence must be between 0 and 100' });
    }

    const existing = await ProxyUrl.findOne({ url });
    if (existing) {
      return res.status(400).json({ error: 'URL is already in proxy list' });
    }

    const proxyUrl = new ProxyUrl({
      url,
      reason,
      confidence: confidence || 100,
      detectionMethod: 'manual',
      addedBy: req.user._id
    });

    await proxyUrl.save();
    res.json(proxyUrl);
  } catch (error) {
    console.error('Add Proxy URL Error:', error);
    res.status(500).json({ error: 'Failed to add URL to proxy list' });
  }
};

exports.removeProxyUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ProxyUrl.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Proxy URL not found' });
    }
    
    res.json({ message: 'URL removed from proxy list' });
  } catch (error) {
    console.error('Remove Proxy URL Error:', error);
    res.status(500).json({ error: 'Failed to remove URL from proxy list' });
  }
};

exports.updateProxyUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, confidence, reason } = req.body;

    if (confidence && (confidence < 0 || confidence > 100)) {
      return res.status(400).json({ error: 'Confidence must be between 0 and 100' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (confidence) updates.confidence = confidence;
    if (reason) updates.reason = reason;

    const proxyUrl = await ProxyUrl.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!proxyUrl) {
      return res.status(404).json({ error: 'Proxy URL not found' });
    }

    res.json(proxyUrl);
  } catch (error) {
    console.error('Update Proxy URL Error:', error);
    res.status(500).json({ error: 'Failed to update proxy URL' });
  }
};