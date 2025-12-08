import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { ReadingStatus } from '@prisma/client';

const router = Router();

/**
 * Fetch cover from Google Books API (same as recommendations)
 */
async function getCoverFromGoogleBooks(title: string, author: string) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      const isbn = book.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier;
      const coverUrl = book.imageLinks?.large || book.imageLinks?.medium || book.imageLinks?.thumbnail;
      
      return {
        coverUrl: coverUrl?.replace('http://', 'https://'),
        isbn,
        pages: book.pageCount,
      };
    }
  } catch (error) {
    console.warn(`Google Books failed for ${title}:`, error);
  }
  return {};
}

/**
 * Fetch cover from Open Library API (same as recommendations)
 */
async function getCoverFromOpenLibrary(title: string, author: string) {
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`
    );
    const data = await response.json();
    
    if (data.docs?.[0]) {
      const book = data.docs[0];
      return {
        coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined,
        isbn: book.isbn?.[0],
        pages: book.number_of_pages_median,
      };
    }
  } catch (error) {
    console.warn(`Open Library failed for ${title}:`, error);
  }
  return {};
}

/**
 * Automatically fetch cover for a book if missing - same logic as recommendations
 */
async function ensureBookHasCover(book: any): Promise<string> {
  // If book already has a valid cover URL, return it
  if (book.coverUrl && book.coverUrl.startsWith('http')) {
    return book.coverUrl;
  }

  console.log(`📷 Fetching cover for "${book.title}" by ${book.author}...`);
  
  //Try both sources in parallel
  const [googleResult, openLibResult] = await Promise.all([
    getCoverFromGoogleBooks(book.title, book.author),
    getCoverFromOpenLibrary(book.title, book.author),
  ]);

  const coverUrl = googleResult.coverUrl || openLibResult.coverUrl;
  
  // If we found a cover, update the database
  if (coverUrl) {
    const updateData: any = { coverUrl };
    if (googleResult.isbn && !book.isbn) updateData.isbn = googleResult.isbn;
    if (googleResult.pages && !book.totalPages) updateData.totalPages = googleResult.pages;

    await prisma.book.update({
      where: { id: book.id },
      data: updateData
    });
    console.log(`✅ Updated cover for "${book.title}"`);
    return coverUrl;
  }

  // Return placeholder if no cover found
  return book.coverUrl || `https://placehold.co/150x220/635C7B/white?text=${encodeURIComponent(book.title.substring(0, 12))}`;
}

/**
 * GET /api/books
 * List all books with their reviews
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        reviews: {
          orderBy: { dateAdded: 'desc' },
        },
        shelf: true,
      },
      orderBy: { dateAdded: 'desc' },
    });

    // Ensure all books have covers (fetch if missing)
    const booksWithCovers = await Promise.all(
      books.map(async (book) => {
        const coverUrl = await ensureBookHasCover(book);
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          reviews: book.reviews.map((r) => ({
            id: r.id,
            content: r.content,
            rating: r.rating,
            dateAdded: r.dateAdded.toISOString().split('T')[0],
          })),
          tags: book.tags,
          coverUrl,
          dateAdded: book.dateAdded.toISOString().split('T')[0],
          status: book.status,
          progress: book.progress,
          totalPages: book.totalPages,
          shelf: book.shelfId,
          isbn: book.isbn,
          description: book.description,
        };
      })
    );

    res.json(booksWithCovers);
  } catch (error) {
    console.error('Failed to fetch books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

/**
 * GET /api/books/:id
 * Get a single book by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { dateAdded: 'desc' },
        },
        shelf: true,
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const transformed = {
      id: book.id,
      title: book.title,
      author: book.author,
      reviews: book.reviews.map((r) => ({
        id: r.id,
        content: r.content,
        rating: r.rating,
        dateAdded: r.dateAdded.toISOString().split('T')[0],
      })),
      tags: book.tags,
      coverUrl: book.coverUrl || '',
      dateAdded: book.dateAdded.toISOString().split('T')[0],
      status: book.status,
      progress: book.progress,
      totalPages: book.totalPages,
      shelf: book.shelfId,
      isbn: book.isbn,
      description: book.description,
    };

    res.json(transformed);
  } catch (error) {
    console.error('Failed to fetch book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

/**
 * POST /api/books
 * Create a new book
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      tags = [],
      coverUrl,
      status = 'want_to_read',
      totalPages,
      shelf,
      isbn,
      description,
      review,
      rating,
    } = req.body;

    // Validate title and author - must be non-empty strings
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and cannot be empty' });
    }
    if (!author || typeof author !== 'string' || author.trim().length === 0) {
      return res.status(400).json({ error: 'Author is required and cannot be empty' });
    }

    // Create book with optional initial review
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        coverUrl: coverUrl || `https://placehold.co/150x220/635C7B/white?text=${encodeURIComponent(title.substring(0, 12))}`,
        status: status as ReadingStatus,
        totalPages: totalPages ? parseInt(totalPages) : null,
        shelfId: shelf || null,
        isbn,
        description,
        progress: status === 'read' && totalPages ? parseInt(totalPages) : null,
        reviews: review
          ? {
              create: {
                content: review,
                rating: rating || 0,
              },
            }
          : undefined,
      },
      include: {
        reviews: true,
        shelf: true,
      },
    });

    const transformed = {
      id: book.id,
      title: book.title,
      author: book.author,
      reviews: book.reviews.map((r) => ({
        id: r.id,
        content: r.content,
        rating: r.rating,
        dateAdded: r.dateAdded.toISOString().split('T')[0],
      })),
      tags: book.tags,
      coverUrl: book.coverUrl || '',
      dateAdded: book.dateAdded.toISOString().split('T')[0],
      status: book.status,
      progress: book.progress,
      totalPages: book.totalPages,
      shelf: book.shelfId,
      isbn: book.isbn,
      description: book.description,
    };

    res.status(201).json(transformed);
  } catch (error) {
    console.error('Failed to create book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

/**
 * PUT /api/books/:id
 * Update a book
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if book exists
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Validate title and author if being updated - must be non-empty strings
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim().length === 0) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
    }
    if (updates.author !== undefined) {
      if (typeof updates.author !== 'string' || updates.author.trim().length === 0) {
        return res.status(400).json({ error: 'Author cannot be empty' });
      }
    }

    // Build update data
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title.trim();
    if (updates.author !== undefined) updateData.author = updates.author.trim();
    if (updates.tags !== undefined) {
      updateData.tags = Array.isArray(updates.tags) 
        ? updates.tags 
        : updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (updates.coverUrl !== undefined) updateData.coverUrl = updates.coverUrl;
    if (updates.status !== undefined) updateData.status = updates.status as ReadingStatus;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.totalPages !== undefined) updateData.totalPages = updates.totalPages;
    if (updates.shelf !== undefined) updateData.shelfId = updates.shelf || null;
    if (updates.isbn !== undefined) updateData.isbn = updates.isbn;
    if (updates.description !== undefined) updateData.description = updates.description;

    const book = await prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        reviews: {
          orderBy: { dateAdded: 'desc' },
        },
        shelf: true,
      },
    });

    const transformed = {
      id: book.id,
      title: book.title,
      author: book.author,
      reviews: book.reviews.map((r) => ({
        id: r.id,
        content: r.content,
        rating: r.rating,
        dateAdded: r.dateAdded.toISOString().split('T')[0],
      })),
      tags: book.tags,
      coverUrl: book.coverUrl || '',
      dateAdded: book.dateAdded.toISOString().split('T')[0],
      status: book.status,
      progress: book.progress,
      totalPages: book.totalPages,
      shelf: book.shelfId,
      isbn: book.isbn,
      description: book.description,
    };

    res.json(transformed);
  } catch (error) {
    console.error('Failed to update book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

/**
 * DELETE /api/books/:id
 * Delete a book
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if book exists
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await prisma.book.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

/**
 * POST /api/books/:id/reviews
 * Add a review to a book
 */
router.post('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Review content is required' });
    }

    // Check if book exists
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const review = await prisma.review.create({
      data: {
        content,
        rating: rating || 0,
        bookId: id,
      },
    });

    res.status(201).json({
      id: review.id,
      content: review.content,
      rating: review.rating,
      dateAdded: review.dateAdded.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Failed to add review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

/**
 * PUT /api/books/:bookId/reviews/:reviewId
 * Update a review
 */
router.put('/:bookId/reviews/:reviewId', async (req: Request, res: Response) => {
  try {
    const { bookId, reviewId } = req.params;
    const { content, rating } = req.body;

    // Check if review exists and belongs to book
    const existing = await prisma.review.findFirst({
      where: { id: reviewId, bookId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(content !== undefined && { content }),
        ...(rating !== undefined && { rating }),
      },
    });

    res.json({
      id: review.id,
      content: review.content,
      rating: review.rating,
      dateAdded: review.dateAdded.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Failed to update review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * DELETE /api/books/:bookId/reviews/:reviewId
 * Delete a review
 */
router.delete('/:bookId/reviews/:reviewId', async (req: Request, res: Response) => {
  try {
    const { bookId, reviewId } = req.params;

    // Check if review exists and belongs to book
    const existing = await prisma.review.findFirst({
      where: { id: reviewId, bookId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export { router as booksRouter };
