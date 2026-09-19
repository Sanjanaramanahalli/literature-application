import { Router, Request, Response } from 'express';
import { WikimediaService } from '../services/wikimediaService.js';

export const externalLiteratureRouter = Router();

// GET /api/external/languages
externalLiteratureRouter.get('/languages', (req: Request, res: Response): void => {
  res.json({
    success: true,
    languages: [
      { code: 'auto', name: 'Auto Detect Script' },
      { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
      { code: 'hi', name: 'Hindi (हिन्दी)' },
      { code: 'en', name: 'English' },
      { code: 'ta', name: 'Tamil (தமிழ்)' },
      { code: 'te', name: 'Telugu (తెలుగు)' },
      { code: 'ml', name: 'Malayalam (മലയാളം)' },
      { code: 'bn', name: 'Bengali (বাংলা)' },
      { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
      { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
      { code: 'ur', name: 'Urdu (اردو)' },
      { code: 'sa', name: 'Sanskrit (संस्कृतम्)' },
      { code: 'fr', name: 'French (Français)' },
      { code: 'de', name: 'German (Deutsch)' },
      { code: 'es', name: 'Spanish (Español)' },
      { code: 'it', name: 'Italian (Italiano)' },
      { code: 'ru', name: 'Russian (Русский)' },
      { code: 'zh', name: 'Chinese (中文)' },
      { code: 'ja', name: 'Japanese (日本語)' },
      { code: 'ar', name: 'Arabic (العربية)' },
    ],
  });
});

// GET /api/external/search?q=...&lang=...
externalLiteratureRouter.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, lang } = req.query;
    if (!q || !String(q).trim()) {
      res.status(400).json({ success: false, error: 'Search query is required.' });
      return;
    }

    const queryStr = String(q).trim();
    const langStr = lang ? String(lang).trim() : 'auto';

    const results = await WikimediaService.searchLiterature(queryStr, langStr);
    const detectedLang = WikimediaService.detectLanguageCode(queryStr);
    const finalLang = langStr !== 'auto' ? langStr : detectedLang;
    res.json({
      success: true,
      query: queryStr,
      languageCode: finalLang,
      detectedLanguage: detectedLang,
      count: results.length,
      results,
    });
  } catch (err: any) {
    console.error('[ExternalLiteratureRouter] Search error:', err);
    res.status(500).json({ success: false, error: 'Failed to search external literature sources.' });
  }
});

// GET /api/external/work/:lang/:title
externalLiteratureRouter.get('/work/:lang/:title', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lang, title } = req.params;
    if (!lang || !title) {
      res.status(400).json({ success: false, error: 'Language code and title are required.' });
      return;
    }

    const detail = await WikimediaService.getWorkDetail(lang, decodeURIComponent(title));
    if (!detail) {
      res.status(404).json({ success: false, error: 'Literature work not found in external archives.' });
      return;
    }

    res.json({ success: true, work: detail });
  } catch (err: any) {
    console.error('[ExternalLiteratureRouter] Work detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve external literature work details.' });
  }
});
