const fetch = require('node-fetch');
const NodeCache = require('node-cache');

const translationCache = new NodeCache({ stdTTL: 2592000 });

const TRANSLATE_API_URL = 'https://cmstranslate.iuptit.com/translate';
const API_KEY = 'hoanggxyuukixiuptit';

exports.translateText = async (req, res) => {
  try {
    const { text, targetLang = 'vi', sourceLang = 'auto' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required for translation' });
    }

    if (text.length > 100000) {
      return res.status(400).json({ 
        message: 'Text exceeds maximum length of 10000 characters' 
      });
    }

    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatches = [];
    let match;

    
    while ((match = urlRegex.exec(text)) !== null) {
      urlMatches.push({
        url: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    
    if (urlMatches.length === 0) {
      const cacheKey = `${text}_${sourceLang}_${targetLang}`;
      
      
      const cachedResult = translationCache.get(cacheKey);
      if (cachedResult) {
        console.log('Translation cache hit');
        return res.json(cachedResult);
      }

      
      const params = new URLSearchParams({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
        alternatives: '0',
        api_key: API_KEY
      });
      
      const response = await fetch(TRANSLATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json'
        },
        body: params
      });
      
      if (!response.ok) {
        throw new Error(`API response error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const translationResult = {
        translatedText: result.translatedText || result.text,
        from: result.detectedLanguage || sourceLang,
        to: targetLang,
      };
      
      translationCache.set(cacheKey, translationResult);
      return res.json(translationResult);
    }

    
    const segments = [];
    let lastIndex = 0;

    urlMatches.forEach((urlMatch) => {
      
      if (urlMatch.startIndex > lastIndex) {
        const textBefore = text.substring(lastIndex, urlMatch.startIndex);
        
        const trailingWhitespace = textBefore.match(/\s+$/);
        const actualText = textBefore.replace(/\s+$/, '');
        
        if (actualText) {
          segments.push({
            type: 'text',
            content: actualText,
            position: segments.length
          });
        }
        
        
        if (trailingWhitespace) {
          segments.push({
            type: 'whitespace',
            content: trailingWhitespace[0],
            position: segments.length
          });
        }
      }
      
      
      segments.push({
        type: 'url',
        content: urlMatch.url,
        position: segments.length
      });
      
      lastIndex = urlMatch.endIndex;
    });

    
    if (lastIndex < text.length) {
      const textAfter = text.substring(lastIndex);
      
      const leadingWhitespace = textAfter.match(/^\s+/);
      const actualText = textAfter.replace(/^\s+/, '');
      
      
      if (leadingWhitespace) {
        segments.push({
          type: 'whitespace',
          content: leadingWhitespace[0],
          position: segments.length
        });
      }
      
      if (actualText) {
        segments.push({
          type: 'text',
          content: actualText,
          position: segments.length
        });
      }
    }

    
    const textSegments = segments.filter(seg => seg.type === 'text');
    
    if (textSegments.length === 0) {
      
      return res.json({
        translatedText: text,
        from: 'auto',
        to: targetLang,
        containsOnlyUrls: true
      });
    }

    
    const translatedSegments = [];
    
    for (let textSeg of textSegments) {
      const cacheKey = `${textSeg.content}_${sourceLang}_${targetLang}`;
      
      
      let cachedResult = translationCache.get(cacheKey);
      if (cachedResult) {
        translatedSegments.push({
          ...textSeg,
          translatedContent: cachedResult.translatedText
        });
        continue;
      }

      try {
        const params = new URLSearchParams({
          q: textSeg.content,
          source: sourceLang,
          target: targetLang,
          format: 'text',
          alternatives: '0',
          api_key: API_KEY
        });
        
        const response = await fetch(TRANSLATE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept': 'application/json'
          },
          body: params
        });
        
        if (!response.ok) {
          throw new Error(`API response error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        const translatedText = result.translatedText || result.text;

        
        const segmentResult = {
          translatedText: translatedText,
          from: result.detectedLanguage || sourceLang,
          to: targetLang,
        };
        translationCache.set(cacheKey, segmentResult);

        translatedSegments.push({
          ...textSeg,
          translatedContent: translatedText
        });
      } catch (error) {
        console.error('Error translating segment:', error);
        translatedSegments.push({
          ...textSeg,
          translatedContent: textSeg.content 
        });
      }
    }

    
    let finalResult = '';
    let textSegmentIndex = 0;

    for (let segment of segments) {
      if (segment.type === 'url') {
        finalResult += segment.content;
      } else if (segment.type === 'whitespace') {
        finalResult += segment.content; 
      } else if (segment.type === 'text') {
        const translatedSeg = translatedSegments[textSegmentIndex];
        finalResult += translatedSeg ? translatedSeg.translatedContent : segment.content;
        textSegmentIndex++;
      }
    }

    const translationResult = {
      translatedText: finalResult,
      from: translatedSegments[0]?.from || sourceLang,
      to: targetLang,
    };

    return res.json(translationResult);
  } catch (error) {
    console.error('Translation error:', error);
    
    if (error.message && error.message.includes('429')) {
      return res.status(429).json({ 
        message: 'Translation service is currently overloaded. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to translate text',
      error: error.message
    });
  }
};

exports.detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required for language detection' });
    }

    
    if (text.length > 100000) {
      return res.status(400).json({ 
        message: 'Text exceeds maximum length for language detection' 
      });
    }

    try {
      const params = new URLSearchParams({
        q: text,
        source: 'auto',
        target: 'vi', 
        format: 'text',
        alternatives: '0',
        api_key: API_KEY
      });
      
      const response = await fetch(TRANSLATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json'
        },
        body: params
      });
      
      if (!response.ok) {
        throw new Error(`API response error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return res.json({
        detectedLanguage: result.detectedLanguage || 'unknown',
        confidence: result.confidence || 1.0,
      });
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ 
      message: 'Failed to detect language',
      error: error.message
    });
  }
};
