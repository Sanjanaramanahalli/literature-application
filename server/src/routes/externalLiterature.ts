import { Router, Request, Response } from 'express';
import { WikimediaService } from '../services/wikimediaService.js';
import { SUPPORTED_INDIAN_LANGUAGES } from '../config/indianLanguages.js';

export const externalLiteratureRouter = Router();

// GET /api/external/languages
externalLiteratureRouter.get('/languages', (req: Request, res: Response): void => {
  res.json({
    success: true,
    languages: [
      { code: 'auto', name: 'Auto Detect (Indian Script)', nativeName: 'ಸ್ವಯಂಚಾಲಿತ' },
      ...SUPPORTED_INDIAN_LANGUAGES.map((l) => ({
        code: l.code,
        name: `${l.name} (${l.nativeName})`,
        nativeName: l.nativeName,
        wiki: l.wiki,
      })),
    ],
  });
});

// GET /api/external/search?q=...&lang=...&limit=...&offset=...
externalLiteratureRouter.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, lang, limit, offset } = req.query;
    if (!q || !String(q).trim()) {
      res.status(400).json({ success: false, error: 'Search query is required.' });
      return;
    }

    const queryStr = String(q).trim();
    const langStr = lang ? String(lang).trim() : 'auto';
    const numLimit = limit ? Math.min(50, Math.max(1, Number(limit))) : 20;
    const numOffset = offset ? Math.max(0, Number(offset)) : 0;

    const searchResponse = await WikimediaService.searchAcrossIndianLanguages(
      queryStr,
      langStr,
      { limit: numLimit, offset: numOffset }
    );

    res.json({
      success: true,
      query: queryStr,
      languageCode: langStr !== 'auto' ? langStr : searchResponse.detectedLanguage,
      detectedLanguage: searchResponse.detectedLanguage,
      total: searchResponse.total,
      count: searchResponse.results.length,
      results: searchResponse.results,
    });
  } catch (err: any) {
    console.error('[ExternalLiteratureRouter] Search error:', err);
    res.status(500).json({ success: false, error: 'Failed to search external Indian literature sources.' });
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

    const detail = await WikimediaService.getLiteraturePage(lang, decodeURIComponent(title));
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
