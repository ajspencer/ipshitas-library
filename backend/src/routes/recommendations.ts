import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

// Parallel AI configuration
const PARALLEL_API_KEY = 'tpbjtFEfkRwrXgVQk1-kERAk7vA53tCb6E6hTOmR'
const PARALLEL_API_BASE = 'https://api.parallel.ai';

// Types for request body
interface BookInput {
  title: string;
  author: string;
  rating: number;
  tags: string[];
  review?: string;
}

interface RecommendationRequest {
  books: BookInput[];
  preferences?: {
    favoriteGenres?: string[];
    avoidGenres?: string[];
    preferredLength?: 'short' | 'medium' | 'long';
  };
  provider?: 'openai' | 'parallel'; // Allow choosing the AI provider
}

interface SimilarBooksRequest {
  title: string;
  author: string;
  genres?: string[];
}

interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
  genres: string[];
  estimatedPages?: number;
  isbn?: string;
  coverUrl?: string;
}

/**
 * Enhance recommendations with cover URLs from Open Library
 */
async function enhanceWithCovers(recommendations: BookRecommendation[]): Promise<BookRecommendation[]> {
  return Promise.all(
    recommendations.map(async (rec) => {
      try {
        const searchResponse = await fetch(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(rec.title)}&author=${encodeURIComponent(rec.author)}&limit=1`
        );
        const searchData = await searchResponse.json();
        
        if (searchData.docs?.[0]) {
          const book = searchData.docs[0];
          return {
            ...rec,
            isbn: book.isbn?.[0],
            coverUrl: book.cover_i 
              ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
              : undefined,
            estimatedPages: rec.estimatedPages || book.number_of_pages_median,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch cover for ${rec.title}:`, error);
      }
      return rec;
    })
  );
}

/**
 * Get recommendations using OpenAI
 */
async function getOpenAIRecommendations(
  books: BookInput[],
  preferences?: RecommendationRequest['preferences']
): Promise<BookRecommendation[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  const openai = new OpenAI({ apiKey });

  const bookSummary = books
    .map(b => {
      let summary = `- "${b.title}" by ${b.author}`;
      if (b.rating) summary += ` (rated ${b.rating}/5)`;
      if (b.tags?.length) summary += ` [${b.tags.join(', ')}]`;
      if (b.review) summary += `\n  Review: "${b.review.substring(0, 200)}${b.review.length > 200 ? '...' : ''}"`;
      return summary;
    })
    .join('\n');

  const preferencesText = preferences
    ? `
Additional preferences:
${preferences.favoriteGenres?.length ? `- Favorite genres: ${preferences.favoriteGenres.join(', ')}` : ''}
${preferences.avoidGenres?.length ? `- Avoid genres: ${preferences.avoidGenres.join(', ')}` : ''}
${preferences.preferredLength ? `- Preferred book length: ${preferences.preferredLength}` : ''}
`.trim()
    : '';

  const prompt = `You are a literary expert and book recommender. Based on the following reading history and preferences, suggest 6 personalized book recommendations.

Reading History:
${bookSummary}

${preferencesText}

Analyze the patterns in the reader's preferences - their favorite themes, writing styles, genres, and what they seem to value in books based on their ratings and reviews. Then recommend books they would likely enjoy.

IMPORTANT: Do NOT recommend any books that are already in their reading history above.

Respond with a JSON array of exactly 6 book recommendations. Each recommendation must have this exact structure:
{
  "title": "Book Title",
  "author": "Author Name",
  "reason": "A personalized 2-3 sentence explanation of why this reader would enjoy this book, referencing specific books from their history",
  "genres": ["Genre1", "Genre2"],
  "estimatedPages": 350
}

Only respond with the JSON array, no other text.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful book recommendation assistant. Always respond with valid JSON arrays only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const responseText = completion.choices[0]?.message?.content?.trim();
  
  if (!responseText) {
    throw new Error('Empty response from OpenAI');
  }

  const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonText);
}

/**
 * Get recommendations using Parallel AI (web-enhanced)
 */
async function getParallelRecommendations(
  books: BookInput[],
  preferences?: RecommendationRequest['preferences']
): Promise<BookRecommendation[]> {
  if (!PARALLEL_API_KEY) {
    throw new Error('Parallel API key not configured. Please set PARALLEL_API_KEY environment variable.');
  }

  const bookSummary = books
    .slice(0, 10)
    .map((b) => {
      let summary = `"${b.title}" by ${b.author}`;
      if (b.rating) summary += ` (rated ${b.rating}/5)`;
      if (b.tags?.length) summary += ` [${b.tags.join(', ')}]`;
      return summary;
    })
    .join('; ');

  const preferencesText = preferences
    ? `Additional preferences: ${preferences.favoriteGenres?.join(', ') || ''} ${preferences.preferredLength || ''}`
    : '';

  const chatResponse = await fetch(`${PARALLEL_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PARALLEL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'speed',
      messages: [
        {
          role: 'system',
          content: 'You are a book recommendation expert with access to current information about books. Provide personalized recommendations based on reading history. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: `Based on this reading history: ${bookSummary}
${preferencesText}

Search the web for highly-rated books that would appeal to this reader. Consider recent releases and critically acclaimed titles.

IMPORTANT: Do NOT recommend any books that are already in their reading history.

Respond with a JSON array of exactly 6 book recommendations. Each must have:
{
  "title": "Book Title",
  "author": "Author Name", 
  "reason": "2-3 sentence personalized explanation referencing their reading history",
  "genres": ["Genre1", "Genre2"],
  "estimatedPages": 300
}

Only respond with the JSON array, no other text.`,
        },
      ],
      stream: false,
    }),
  });

  if (!chatResponse.ok) {
    const errorData = await chatResponse.json().catch(() => ({}));
    console.error('Parallel Chat API error:', errorData);
    throw new Error(`Parallel Chat API error: ${chatResponse.status}`);
  }

  const chatData = await chatResponse.json();
  const responseText = chatData.choices?.[0]?.message?.content?.trim();

  if (!responseText) {
    throw new Error('Empty response from Parallel');
  }

  const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonText);
}

/**
 * Find similar books using Parallel AI's web search
 */
async function findSimilarBooksWithParallel(
  title: string,
  author: string,
  genres?: string[]
): Promise<BookRecommendation[]> {
  if (!PARALLEL_API_KEY) {
    throw new Error('Parallel API key not configured. Please set PARALLEL_API_KEY environment variable.');
  }

  const genreText = genres?.length ? ` in genres like ${genres.join(', ')}` : '';

  // Use Parallel's Search API to find similar books
  const searchResponse = await fetch(`${PARALLEL_API_BASE}/v1beta/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': PARALLEL_API_KEY,
      'parallel-beta': 'search-extract-2025-10-10',
    },
    body: JSON.stringify({
      objective: `Find book recommendations similar to "${title}" by ${author}${genreText}. Look for books with similar themes, writing style, or that fans of this book would enjoy. Focus on specific book titles and their authors.`,
      search_queries: [
        `books similar to "${title}" by ${author}`,
        `if you liked "${title}" you'll love`,
        `books like "${title}" recommendations`,
      ],
      max_results: 15,
      excerpts: {
        max_chars_per_result: 3000,
      },
    }),
  });

  if (!searchResponse.ok) {
    console.error('Parallel Search API error:', searchResponse.status);
    // Fall back to chat-based recommendations
    return findSimilarBooksWithChat(title, author, genres);
  }

  const searchData = await searchResponse.json();
  const books = parseSearchResultsForBooks(searchData, title, author);

  // If we didn't find enough books from parsing, use chat fallback
  if (books.length < 3) {
    const chatBooks = await findSimilarBooksWithChat(title, author, genres);
    const seenTitles = new Set(books.map(b => b.title.toLowerCase()));
    for (const book of chatBooks) {
      if (!seenTitles.has(book.title.toLowerCase())) {
        books.push(book);
      }
    }
  }

  return books.slice(0, 6);
}

/**
 * Parse Parallel search results to extract book recommendations
 */
function parseSearchResultsForBooks(
  searchData: any,
  originalTitle: string,
  originalAuthor: string
): BookRecommendation[] {
  const books: BookRecommendation[] = [];
  const seenTitles = new Set<string>([originalTitle.toLowerCase()]);

  const results = searchData.results || searchData.organic_results || [];
  
  for (const result of results) {
    const excerpt = result.excerpt || result.snippet || '';
    const title = result.title || '';
    
    const bookPatterns = [
      /"([^"]+)"\s+by\s+([^,.\n]+)/gi,
      /["']([^"']+)["']\s+by\s+([^,.\n]+)/gi,
      /([A-Z][^,]+)\s+by\s+([A-Z][^,.\n]+)/gi,
    ];

    const fullText = `${title} ${excerpt}`;
    
    for (const pattern of bookPatterns) {
      let match;
      while ((match = pattern.exec(fullText)) !== null && books.length < 10) {
        const bookTitle = match[1].trim();
        const bookAuthor = match[2].trim();
        
        if (
          seenTitles.has(bookTitle.toLowerCase()) ||
          bookTitle.toLowerCase() === originalTitle.toLowerCase() ||
          bookTitle.length < 3 ||
          bookTitle.length > 100 ||
          bookAuthor.length < 2 ||
          bookAuthor.length > 50
        ) {
          continue;
        }

        seenTitles.add(bookTitle.toLowerCase());
        
        books.push({
          title: bookTitle,
          author: bookAuthor,
          reason: `Recommended as similar to "${originalTitle}" based on web search results.`,
          genres: [],
        });
      }
    }
  }

  return books;
}

/**
 * Fallback: Use Parallel Chat to get similar book recommendations
 */
async function findSimilarBooksWithChat(
  title: string,
  author: string,
  genres?: string[]
): Promise<BookRecommendation[]> {
  if (!PARALLEL_API_KEY) return [];

  const genreText = genres?.length ? ` The book is in the ${genres.join(', ')} genre(s).` : '';

  const chatResponse = await fetch(`${PARALLEL_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PARALLEL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'speed',
      messages: [
        {
          role: 'user',
          content: `Find 6 books similar to "${title}" by ${author}.${genreText} Search the web for current recommendations from readers who enjoyed this book.

Respond with a JSON array where each item has:
{
  "title": "Book Title",
  "author": "Author Name",
  "reason": "Why this book is similar and why fans would enjoy it",
  "genres": ["Genre1", "Genre2"],
  "estimatedPages": 300
}

Only respond with the JSON array.`,
        },
      ],
      stream: false,
    }),
  });

  if (!chatResponse.ok) return [];

  const chatData = await chatResponse.json();
  const responseText = chatData.choices?.[0]?.message?.content?.trim();
  
  if (!responseText) return [];

  try {
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonText);
  } catch {
    return [];
  }
}

/**
 * POST /api/recommendations
 * Generate personalized book recommendations based on user's library
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { books, preferences, provider = 'openai' }: RecommendationRequest = req.body;

    if (!books || books.length === 0) {
      return res.status(400).json({ 
        error: 'Please provide at least one book to generate recommendations' 
      });
    }

    let recommendations: BookRecommendation[];
    let source = provider;

    try {
      if (provider === 'parallel') {
        recommendations = await getParallelRecommendations(books, preferences);
      } else {
        recommendations = await getOpenAIRecommendations(books, preferences);
      }
    } catch (primaryError) {
      console.warn(`Primary provider (${provider}) failed, trying fallback:`, primaryError);
      
      // Try fallback provider
      try {
        if (provider === 'parallel') {
          recommendations = await getOpenAIRecommendations(books, preferences);
          source = 'openai';
        } else {
          recommendations = await getParallelRecommendations(books, preferences);
          source = 'parallel';
        }
      } catch (fallbackError) {
        throw primaryError; // Re-throw original error if both fail
      }
    }

    if (!Array.isArray(recommendations)) {
      throw new Error('Invalid response format');
    }

    // Enhance recommendations with cover URLs
    const enhancedRecommendations = await enhanceWithCovers(recommendations);

    res.json({
      recommendations: enhancedRecommendations,
      basedOn: books.length,
      generatedAt: new Date().toISOString(),
      source,
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (error.message.includes('rate limit')) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to generate recommendations. Please try again.' 
    });
  }
});

/**
 * POST /api/recommendations/similar
 * Find similar books to a specific book using Parallel AI's web search
 */
router.post('/similar', async (req: Request, res: Response) => {
  try {
    const { title, author, genres }: SimilarBooksRequest = req.body;

    if (!title || !author) {
      return res.status(400).json({
        error: 'Please provide book title and author',
      });
    }

    if (!PARALLEL_API_KEY) {
      return res.status(500).json({
        error: 'Parallel API key not configured. Please set PARALLEL_API_KEY environment variable.',
      });
    }

    const similarBooks = await findSimilarBooksWithParallel(title, author, genres);
    
    // Enhance with cover images
    const enhancedBooks = await enhanceWithCovers(similarBooks);

    res.json({
      similarBooks: enhancedBooks,
      basedOn: { title, author },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Similar books error:', error);
    res.status(500).json({
      error: 'Failed to find similar books. Please try again.',
    });
  }
});

export { router as recommendationsRouter };
