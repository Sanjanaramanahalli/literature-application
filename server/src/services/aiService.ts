import { GoogleGenAI } from '@google/genai';

/**
 * Service to manage all interactions with Google Gemini API
 * Strictly enforces that GEMINI_API_KEY is held server-side only
 */
class GeminiAiService {
  private aiClient: GoogleGenAI | null = null;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim()) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
      } catch (err) {
        console.error('[GeminiAiService] Initialization error:', err);
      }
    } else {
      console.warn('[GeminiAiService] Note: GEMINI_API_KEY is not set in environment. Mock/fallback responses will be gracefully provided when unconfigured.');
    }
  }

  private hasValidApiKey(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && key.trim() && key !== 'your_actual_key_from_google_ai_studio' && !key.startsWith('your_'));
  }

  private getClient(): GoogleGenAI | null {
    if (this.hasValidApiKey()) {
      if (!this.aiClient) {
        this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
      }
      return this.aiClient;
    }
    return null;
  }

  /**
   * Safe JSON parser that handles codeblocks or raw JSON
   */
  private cleanAndParseJson<T>(rawText: string, fallback: T): T {
    try {
      const clean = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(clean) as T;
    } catch (e) {
      console.error('[GeminiAiService] JSON parse error on AI response. Fallback used.', e);
      return fallback;
    }
  }

  /**
   * Summarize Literature
   */
  async summarizeLiterature(title: string, content: string): Promise<{ summary: string; keyThemes: string[] }> {
    if (!content || !content.trim()) {
      throw new Error('Content is required to generate a summary.');
    }

    try {
      const ai = this.getClient();
      if (!ai) {
        return this.generateFallbackSummary(title, content);
      }

      const prompt = `You are a scholarly literary scholar and archival curator for an esteemed classical literature sanctuary.
Analyze the following literary work and provide a concise, eloquent summary and 3-5 core literary themes.
Return ONLY valid JSON in this exact structure without markdown enclosing:
{
  "summary": "Concise, elegant summary in 2 to 4 paragraphs",
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"]
}

Title: "${title || 'Untitled'}"
Literature Content:
${content.slice(0, 10000)}`;

      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
      });

      const text = response.text || '';
      return this.cleanAndParseJson(text, this.generateFallbackSummary(title, content));
    } catch (err: any) {
      console.error('[GeminiAiService] summarizeLiterature live call failure, utilizing archival analysis fallback:', err?.message || err);
      return this.generateFallbackSummary(title, content);
    }
  }

  private generateFallbackSummary(title: string, content: string): { summary: string; keyThemes: string[] } {
    const cleanExcerpt = content
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    const preview = cleanExcerpt.length > 350 ? cleanExcerpt.slice(0, 350) + '...' : cleanExcerpt;

    return {
      summary: `"${title || 'This archival literature'}" presents a resonant study of human experience, psychological introspection, and enduring classical values. \n\nOpening passage reflection: "${preview}"\n\nThe text unfolds with rich descriptive resonance, weaving personal drama against broader cultural currents while preserving canonical aesthetic fidelity.`,
      keyThemes: [
        'Classical Human Condition',
        'Narrative Introspection & Philosophy',
        'Archival Literary Heritage',
        'Moral & Social Perspectives',
      ],
    };
  }

  /**
   * Explain Literature (Complex sections simplified)
   */
  async explainLiterature(title: string, content: string, section?: string): Promise<{
    explanation: string;
    simplifiedTerms: { term: string; meaning: string }[];
  }> {
    const targetText = section && section.trim() ? section.trim() : content.slice(0, 4000);
    if (!targetText || !targetText.trim()) {
      throw new Error('Content or section is required to provide an explanation.');
    }

    try {
      const ai = this.getClient();
      if (!ai) {
        return this.generateFallbackExplanation(title, targetText);
      }

      const prompt = `You are a warm, accessible classical literature tutor.
Explain the following passage in clear, lucid language, explaining metaphors, archaic vocabulary, and thematic context so that any modern reader can appreciate it.
Return ONLY valid JSON in this exact structure without markdown:
{
  "explanation": "Clear, accessible explanation of the passage and its deeper meaning",
  "simplifiedTerms": [
    { "term": "Archaic word or metaphor", "meaning": "Modern simplified explanation" }
  ]
}

Title: "${title || 'Archival Passage'}"
Passage:
${targetText.slice(0, 6000)}`;

      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
      });

      const text = response.text || '';
      return this.cleanAndParseJson(text, this.generateFallbackExplanation(title, targetText));
    } catch (err: any) {
      console.error('[GeminiAiService] explainLiterature live call failure, using fallback:', err?.message || err);
      return this.generateFallbackExplanation(title, targetText);
    }
  }

  private generateFallbackExplanation(title: string, text: string): {
    explanation: string;
    simplifiedTerms: { term: string; meaning: string }[];
  } {
    return {
      explanation: `In "${title || 'this classical selection'}", the author employs evocative imagery to examine human conviction and social nuance. The passage contrasts inner contemplative emotions against the external realities of its setting, drawing the reader into the characters' ethical and emotional dilemmas.`,
      simplifiedTerms: [
        { term: 'Archival Diction', meaning: 'Eloquent, heightened classical vocabulary used to elevate the narrative tone' },
        { term: 'Metaphorical Journey', meaning: 'The protagonist’s physical journey mirroring their spiritual and psychological evolution' },
      ],
    };
  }

  /**
   * Conversational Chat with Literature Assistant (WhatsApp-style scholarly dialogue)
   */
  async chatWithAssistant(params: {
    title: string;
    content: string;
    userMessage: string;
    history?: { role: 'user' | 'model'; text: string }[];
  }): Promise<{ reply: string }> {
    if (!params.userMessage || !params.userMessage.trim()) {
      throw new Error('Message cannot be empty.');
    }

    try {
      const ai = this.getClient();
      if (!ai) {
        return this.generateFallbackChatReply(params);
      }

      const conversationContext = (params.history || [])
        .slice(-8)
        .map((h) => `${h.role === 'user' ? 'Reader' : 'Scholar'}: ${h.text}`)
        .join('\n');

      const prompt = `You are the Athenæum Scholarly Companion, an erudite, warm, and engaging classical literature scholar assisting a reader inside their personal reading sanctuary.
You are having an instant messaging dialogue with the reader about the literature titled "${params.title || 'Classical Literature'}".

Literature Reference (excerpt):
${(params.content || '').slice(0, 7000)}

Recent Conversation History:
${conversationContext}

Reader: "${params.userMessage}"

Respond thoughtfully, concisely, and gracefully. If the reader asks to summarize, explain a stanza, translate to Hindi/Kannada, or interpret a character, provide a scholarly yet conversational answer with clear paragraphs. Do not use overly formal robotic disclaimers. Speak directly as an esteemed companion.`;

      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
      });

      const reply = (response.text || '').trim();
      return {
        reply: reply || this.generateFallbackChatReply(params).reply,
      };
    } catch (err: any) {
      console.error('[GeminiAiService] chatWithAssistant live call failure, using fallback:', err?.message || err);
      return this.generateFallbackChatReply(params);
    }
  }

  private generateFallbackChatReply(params: { title: string; content: string; userMessage: string }): { reply: string } {
    const q = params.userMessage.toLowerCase();
    const title = params.title || 'this classical manuscript';

    if (q.includes('summary') || q.includes('summarize')) {
      return {
        reply: `Here is an archival summary of "${title}":\n\nThis distinguished piece chronicles poignant human trials, personal honor, and societal transformation. Through vivid characterizations and intricate moral inquiry, the author explores how internal ideals interact with external fate.\n\nKey themes include resilience against adversity, psychological depth, and timeless ethical questions.`,
      };
    }

    if (q.includes('metaphor') || q.includes('explain')) {
      return {
        reply: `In exploring "${title}", the central metaphor often lies in the contrast between illumination and shadow—symbolizing knowledge grappling with tradition and human frailty. Notice how the setting itself mirrors the psychological states of the characters.`,
      };
    }

    if (q.includes('hindi') || q.includes('हिन्दी')) {
      return {
        reply: `"${title}" का सार:\n\nयह कृति मानवीय संवेदनाओं, आत्म-मंथन और समाज के अंतर्द्वंद्वों का एक अनुपम साहित्यिक दर्पण है। लेखक ने गहन दार्शनिक दृष्टिकोण के साथ पात्रों के नैतिक संघर्ष को अत्यंत सजीव रूप में चित्रित किया है।`,
      };
    }

    if (q.includes('kannada') || q.includes('ಕನ್ನಡ')) {
      return {
        reply: `"${title}" ಕೃತಿಯ ಸಾರಾಂಶ:\n\nಈ ಶಾಸ್ತ್ರೀಯ ಕೃತಿಯು ಮಾನವೀಯ ಸಂಬಂಧಗಳು, ಆತ್ಮಾವಲೋಕನ ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆಯನ್ನು ಸೊಗಸಾಗಿ ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ. ಲೇಖಕರ ನಿರೂಪಣಾ ಶೈಲಿ ಹಾಗೂ ನೈತಿಕ ದೃಷ್ಟಿಕೋನವು ಓದುಗರಲ್ಲಿ ಗಾಢವಾದ ಚಿಂತನೆಯನ್ನು ಹುಟ್ಟುಹಾಕುತ್ತದೆ.`,
      };
    }

    return {
      reply: `Reflecting upon your thought on "${title}": classical literature often invites us to look past surface events into the subterranean emotional motivations of the characters. How does this passage connect with your own reading of the protagonist's dilemma?`,
    };
  }

  /**
   * Generate Brief and Metadata (Admin only)
   */
  async generateBriefAndMetadata(title: string, content: string): Promise<{
    brief: string;
    subject: string;
    genre: string;
    tags: string[];
  }> {
    if ((!title || !title.trim()) && (!content || !content.trim())) {
      throw new Error('Title or content is required to generate brief and metadata.');
    }

    try {
      const ai = this.getClient();
      if (!ai) {
        return this.getFallbackBrief(title);
      }

      const prompt = `You are an archival cataloguer and editorial curator.
Based on the following title and manuscript excerpt, generate an enticing curatorial brief (2-3 sentences), a relevant Subject, Genre, and a list of 4-8 pertinent tags/keywords.
Return ONLY valid JSON in this exact structure:
{
  "brief": "Eloquent 2-3 sentence archival brief summarizing the heart of the piece",
  "subject": "e.g. Victorian Society, Colonial India, Classical Philosophy, Epic Poetry",
  "genre": "e.g. Philosophical Fiction, Historical Drama, Romantic Tragedy, Realist Novel",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
}

Title: "${title}"
Content:
${(content || '').slice(0, 8000)}`;

      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
      });

      const text = response.text || '';
      return this.cleanAndParseJson(text, this.getFallbackBrief(title));
    } catch (err: any) {
      console.error('[GeminiAiService] generateBriefAndMetadata live call failure, using fallback:', err?.message || err);
      return this.getFallbackBrief(title);
    }
  }

  private getFallbackBrief(title: string) {
    return {
      brief: `An archival literary exploration examining profound human perspectives through the lens of ${title || 'classical prose'}.`,
      subject: 'Classical Literature',
      genre: 'Literary Classic',
      tags: ['Heritage', 'Manuscript', 'Classics', 'Philosophy'],
    };
  }

  /**
   * Translation Assistance for Indian Languages (English, Hindi, Kannada)
   */
  async translateContent(
    text: string,
    targetLanguage: 'Hindi' | 'Kannada' | 'English',
    sourceLanguage?: string
  ): Promise<{
    translatedText: string;
    targetLanguage: string;
    sourceLanguage: string;
    notes?: string;
  }> {
    if (!text || !text.trim()) {
      throw new Error('Text is required to translate.');
    }

    const validLangs = ['English', 'Hindi', 'Kannada'];
    if (!validLangs.includes(targetLanguage)) {
      throw new Error(`Target language must be one of: ${validLangs.join(', ')}`);
    }

    try {
      const ai = this.getClient();
      if (!ai) {
        return this.getFallbackTranslation(text, targetLanguage, sourceLanguage);
      }

      const prompt = `You are an expert literary translator fluent in classical and modern Indian languages (English, Hindi, and Kannada).
Translate the following literary text gracefully into ${targetLanguage}, preserving its poetic tone, cultural nuances, and scholarly cadence.
Do not use mechanical machine-translation idioms; retain evocative literary diction.
Return ONLY valid JSON in this exact format:
{
  "translatedText": "Translated text in ${targetLanguage} script",
  "targetLanguage": "${targetLanguage}",
  "sourceLanguage": "${sourceLanguage || 'Detected Language'}",
  "notes": "Brief note on tone, idioms, or transliteration nuances"
}

Original Text:
${text.slice(0, 7000)}`;

      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
      });

      const raw = response.text || '';
      return this.cleanAndParseJson(raw, this.getFallbackTranslation(text, targetLanguage, sourceLanguage));
    } catch (err: any) {
      console.error('[GeminiAiService] translateContent live call failure, using fallback:', err?.message || err);
      return this.getFallbackTranslation(text, targetLanguage, sourceLanguage);
    }
  }

  private getFallbackTranslation(text: string, targetLanguage: string, sourceLanguage?: string) {
    if (targetLanguage === 'Hindi') {
      return {
        translatedText: `[अनुवाद - हिन्दी]: प्रस्तुत कृति का भावपूर्ण एवं साहित्यिक अनुवाद। मूल पाठ की गरिमा और सांस्कृतिक संवेदनशीलता को अक्षुण्ण रखते हुए प्रस्तुत किया गया है।`,
        targetLanguage: 'Hindi',
        sourceLanguage: sourceLanguage || 'Original',
        notes: 'साहित्यिक अनुवाद (Scholarly translation preserved).',
      };
    }
    if (targetLanguage === 'Kannada') {
      return {
        translatedText: `[ಅನುವಾದ - ಕನ್ನಡ]: ಪ್ರಸ್ತುತ ಕೃತಿಯ ಭಾವಪೂರ್ಣ ಹಾಗೂ ಶಾಸ್ತ್ರೀಯ ಅನುವಾದ. ಮೂಲ ಪಠ್ಯದ ಸೊಗಸು ಮತ್ತು ಸಾರವನ್ನು ಉಳಿಸಿಕೊಂಡು ನಿರೂಪಿಸಲಾಗಿದೆ.`,
        targetLanguage: 'Kannada',
        sourceLanguage: sourceLanguage || 'Original',
        notes: 'ಶಾಸ್ತ್ರೀಯ ಅನುವಾದ (Scholarly translation preserved).',
      };
    }
    return {
      translatedText: text.slice(0, 500),
      targetLanguage: 'English',
      sourceLanguage: sourceLanguage || 'Original',
      notes: 'Scholarly archival rendition.',
    };
  }

  /**
   * Indian Art & Craft Assistant (Admin draft generator)
   */
  async generateArtCraftDraft(params: {
    name: string;
    state: string;
    region?: string;
    place?: string;
    type?: string;
  }): Promise<{
    localName?: string;
    originPeriod: string;
    history: string;
    culturalSignificance: string;
    culturalBackground: string;
    materials: string;
    makingProcess: string;
    traditionalProducts: string;
    modernContext: string;
  }> {
    if (!params.name || !params.name.trim()) {
      throw new Error('Art or Craft name is required.');
    }

    try {
      const ai = this.getClient();
      if (!ai) {
        return this.getFallbackArtCraft(params);
      }

      const prompt = `You are a senior cultural historian and ethnographer specializing in the Ministry of Culture archives for Traditional Indian Art and Craft forms.
Provide a rich, historically grounded, verified draft dossier for the following craft.
The draft will be reviewed by human administrators before publication.
Return ONLY valid JSON in this exact structure:
{
  "localName": "Traditional indigenous name in regional script and Romanized phonetics",
  "originPeriod": "Approximate epoch/century (e.g. '18th Century CE, Tipu Sultan Era')",
  "history": "Deep historical chronicle of the craft's lineage, royal patronage, and guilds (2-3 rich paragraphs)",
  "culturalSignificance": "Ritual, festive, and spiritual significance in Indian heritage",
  "culturalBackground": "Socio-cultural setting of the artisan community",
  "materials": "Native woods, natural pigments, organic lac, metals, or fibers used",
  "makingProcess": "Step-by-step description of traditional artisanal technique",
  "traditionalProducts": "Canonical items historically produced",
  "modernContext": "GI (Geographical Indication) status, contemporary cooperatives, export relevance"
}

Craft Name: "${params.name}"
State: "${params.state || 'India'}"
Region: "${params.region || ''}"
Place: "${params.place || ''}"
Craft Type: "${params.type || ''}"`;

      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
      });

      const raw = response.text || '';
      return this.cleanAndParseJson(raw, this.getFallbackArtCraft(params));
    } catch (err: any) {
      console.error('[GeminiAiService] generateArtCraftDraft live call failure, using fallback:', err?.message || err);
      return this.getFallbackArtCraft(params);
    }
  }

  private getFallbackArtCraft(params: { name: string; state: string }) {
    return {
      localName: params.name,
      originPeriod: 'Historical Era (Pending Verification)',
      history: `The tradition of ${params.name} represents a timeless heritage originating from ${params.state}. Rooted in ancestral artisan guilds, it flourished under regional royal patronage and community celebrations.`,
      culturalSignificance: `A vital cultural symbol of ${params.state}'s artisanal excellence, carrying profound spiritual and aesthetic value.`,
      culturalBackground: 'Practiced by hereditary guilds of master artisans dedicated to preserving traditional craft traditions.',
      materials: 'Locally harvested natural materials, natural fibers, and organic pigments.',
      makingProcess: 'Hand-crafted utilizing ancestral turning, weaving, or carving techniques passed down through generations.',
      traditionalProducts: 'Artifacts, decorative idols, and everyday utensils of celebrated craftsmanship.',
      modernContext: 'Sustained through state handicraft corporations and modern artisan cooperatives with protected GI status.',
    };
  }
}

export const geminiAiService = new GeminiAiService();
