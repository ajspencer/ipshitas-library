import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const PARALLEL_API_KEY = 'tpbjtFEfkRwrXgVQk1-kERAk7vA53tCb6E6hTOmR';

interface ExtractRequest {
  url: string;
}

interface ParallelExcerpt {
  text: string;
  source_url: string;
}

interface ParallelResult {
  url: string;
  title?: string;
  content?: string;
  full_content?: string;
  excerpts?: ParallelExcerpt[];
  error?: string;
}

interface ParallelResponse {
  results?: ParallelResult[];
  excerpts?: ParallelExcerpt[];
  full_content?: string;
  error?: string;
}

/**
 * Extract article content from a URL using Parallel API
 */
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as ExtractRequest;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (!PARALLEL_API_KEY) {
      return res.status(500).json({ error: 'Parallel API key not configured' });
    }

    // Call Parallel Extract API
    const response = await fetch('https://api.parallel.ai/v1beta/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PARALLEL_API_KEY,
        'parallel-beta': 'search-extract-2025-10-10',
      },
      body: JSON.stringify({
        urls: [url],
        objective: 'Extract the complete main article text content for reading.',
        excerpts: true,
        full_content: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Parallel API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Failed to extract article: ${response.statusText}` 
      });
    }

    const data = await response.json() as ParallelResponse;
    console.log('Parallel API response:', JSON.stringify(data, null, 2));
    
    // Try multiple ways to get the extracted text
    let extractedText = '';
    let articleTitle = '';
    
    // Check for results array (the actual response format)
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      articleTitle = result.title || '';
      extractedText = result.full_content || 
        result.content || 
        (result.excerpts?.map(e => e.text).join('\n\n')) || 
        '';
    }
    
    // Fallback to top-level fields
    if (!extractedText) {
      extractedText = data.full_content || 
        (data.excerpts?.map(e => e.text).join('\n\n')) || 
        '';
    }

    if (!extractedText) {
      console.error('No content extracted. Response structure:', Object.keys(data));
      return res.status(404).json({ error: 'Could not extract content from the URL' });
    }
    
    // Clean up the text - remove markdown links, extra whitespace, etc.
    extractedText = extractedText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to plain text
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/Advertisement\n?/g, '') // Remove "Advertisement" text
      .trim();

    // Count words
    const wordCount = extractedText
      .trim()
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;

    // Calculate pages (250 words per page is standard)
    const pageCount = Math.ceil(wordCount / 250);

    res.json({
      url,
      title: articleTitle,
      text: extractedText,
      wordCount,
      pageCount,
      wordsPerPage: 250,
    });

  } catch (error) {
    console.error('Error extracting article:', error);
    res.status(500).json({ error: 'Failed to extract article content' });
  }
});

/**
 * Get all saved articles
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: {
        dateAdded: 'desc',
      },
    });
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * Save a new article
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, url, text, wordCount, pageCount } = req.body;
    
    if (!title || !url || !text || wordCount === undefined || pageCount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const article = await prisma.article.create({
      data: {
        title,
        url,
        text,
        wordCount,
        pageCount,
      },
    });
    
    res.status(201).json(article);
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

/**
 * Delete an article
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.article.delete({
      where: { id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

export const articlesRouter = router;

