import { Router, Response } from 'express';
import { geminiAiService } from '../services/aiService.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { aiRateLimiter, validateAiInput } from '../middleware/aiRateLimiter.js';

export const aiRouter = Router();

// Apply authentication first so authenticated user ID is tracked per user, not shared IP
aiRouter.use(authenticateToken);
aiRouter.use(aiRateLimiter);
aiRouter.use(validateAiInput);

/**
 * 1. Summarize Literature
 * Reader & Admin accessible
 */
aiRouter.post('/summarize', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Literature content is required for summarization.' });
      return;
    }

    const result = await geminiAiService.summarizeLiterature(title || 'Selected Work', content);
    res.json({
      success: true,
      data: result,
      source: 'Google Gemini 2.5',
      disclaimer: 'AI-generated summary for scholarly appreciation.',
    });
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'AI service is temporarily unavailable. Please try again later.' });
  }
});

/**
 * 2. Explain Literature
 * Reader & Admin accessible
 */
aiRouter.post('/explain', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, section } = req.body;
    if (!content && !section) {
      res.status(400).json({ error: 'Literature content or passage is required for explanation.' });
      return;
    }

    const result = await geminiAiService.explainLiterature(title || 'Literature Passage', content || '', section);
    res.json({
      success: true,
      data: result,
      source: 'Google Gemini 2.5',
      disclaimer: 'AI-generated explanation.',
    });
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'AI service is temporarily unavailable. Please try again later.' });
  }
});

/**
 * 2.5. Chat with Literature Assistant (WhatsApp-style interactive conversation)
 * Reader & Admin accessible
 */
aiRouter.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, userMessage, history } = req.body;
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      res.status(400).json({ error: 'A message is required to converse with the scholar.' });
      return;
    }

    const result = await geminiAiService.chatWithAssistant({
      title: title || 'Classical Work',
      content: content || '',
      userMessage: userMessage.trim(),
      history: Array.isArray(history) ? history : [],
    });

    res.json({
      success: true,
      reply: result.reply,
      source: 'Google Gemini 2.5',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'AI service is temporarily unavailable. Please try again later.' });
  }
});

/**
 * 3. Translate Literature
 * Supports English, Hindi, Kannada
 * Reader & Admin accessible
 */
aiRouter.post('/translate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text to translate is required.' });
      return;
    }

    if (!targetLanguage || !['Hindi', 'Kannada', 'English'].includes(targetLanguage)) {
      res.status(400).json({ error: 'Supported target languages are: English, Hindi, and Kannada.' });
      return;
    }

    const result = await geminiAiService.translateContent(text, targetLanguage, sourceLanguage);
    res.json({
      success: true,
      data: result,
      source: 'Google Gemini 2.5',
      disclaimer: 'AI-generated translation draft. Review required before reliance or publication.',
    });
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'AI service is temporarily unavailable. Please try again later.' });
  }
});

/**
 * 4. Generate Brief
 * Admin only
 */
aiRouter.post(
  '/generate-brief',
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, content } = req.body;
      if (!title && !content) {
        res.status(400).json({ error: 'Manuscript title or content is required to generate brief.' });
        return;
      }

      const result = await geminiAiService.generateBriefAndMetadata(title || '', content || '');
      res.json({
        success: true,
        data: {
          brief: result.brief,
        },
        disclaimer: 'Draft brief generated for curatorial editorial review.',
      });
    } catch (err: any) {
      res.status(503).json({ error: err.message || 'AI service is temporarily unavailable. Please try again later.' });
    }
  }
);

/**
 * 5. Generate Tags & Editorial Metadata (Subject, Genre, Tags)
 * Admin only
 */
aiRouter.post(
  '/generate-tags',
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, content } = req.body;
      if (!title && !content) {
        res.status(400).json({ error: 'Manuscript title or content is required to suggest tags.' });
        return;
      }

      const result = await geminiAiService.generateBriefAndMetadata(title || '', content || '');
      res.json({
        success: true,
        data: {
          subject: result.subject,
          genre: result.genre,
          tags: result.tags,
          brief: result.brief,
        },
        disclaimer: 'Draft suggestions generated for curatorial editorial approval.',
      });
    } catch (err: any) {
      res.status(503).json({ error: err.message || 'AI service is temporarily unavailable. Please try again later.' });
    }
  }
);

/**
 * 6. Generate Indian Art & Craft Draft
 * Admin only
 */
aiRouter.post(
  '/art-craft',
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, state, region, place, type } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Art or craft name is required.' });
        return;
      }
      if (!state || typeof state !== 'string' || !state.trim()) {
        res.status(400).json({ error: 'State is required.' });
        return;
      }

      const result = await geminiAiService.generateArtCraftDraft({
        name: name.trim(),
        state: state.trim(),
        region: region ? String(region).trim() : undefined,
        place: place ? String(place).trim() : undefined,
        type: type ? String(type).trim() : undefined,
      });

      res.json({
        success: true,
        data: result,
        disclaimer: 'Draft cultural dossier generated. Admin verification required before publishing.',
      });
    } catch (err: any) {
      res.status(503).json({ error: err.message || 'AI service is temporarily unavailable. Please try again later.' });
    }
  }
);
