/**
 * Open Library API integration for book search and cover images
 * https://openlibrary.org/developers/api
 */

export interface OpenLibraryBook {
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  pageCount?: number;
  publishYear?: number;
  description?: string;
}

interface OpenLibrarySearchResult {
  docs: Array<{
    title: string;
    author_name?: string[];
    isbn?: string[];
    cover_i?: number;
    number_of_pages_median?: number;
    first_publish_year?: number;
    subject?: string[];
  }>;
  numFound: number;
}

/**
 * Search for books using Open Library API
 * @param query - Search query (title, author, or ISBN)
 * @returns Array of book results
 */
export async function searchBooks(query: string): Promise<OpenLibraryBook[]> {
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=title,author_name,isbn,cover_i,number_of_pages_median,first_publish_year`
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const data: OpenLibrarySearchResult = await response.json();
    
    return data.docs.map(doc => ({
      title: doc.title,
      author: doc.author_name?.[0] || 'Unknown Author',
      isbn: doc.isbn?.[0],
      coverUrl: doc.cover_i 
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : undefined,
      pageCount: doc.number_of_pages_median,
      publishYear: doc.first_publish_year,
    }));
  } catch (error) {
    console.error('Failed to search books:', error);
    return [];
  }
}

/**
 * Get book cover URL by ISBN
 * @param isbn - Book ISBN (10 or 13 digit)
 * @param size - Cover size: S, M, or L
 * @returns Cover image URL
 */
export function getBookCoverUrl(isbn: string, size: 'S' | 'M' | 'L' = 'L'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
}

/**
 * Get book details by ISBN
 * @param isbn - Book ISBN
 * @returns Book details or null if not found
 */
export async function getBookByIsbn(isbn: string): Promise<OpenLibraryBook | null> {
  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    const bookData = data[`ISBN:${isbn}`];
    
    if (!bookData) return null;
    
    return {
      title: bookData.title,
      author: bookData.authors?.[0]?.name || 'Unknown Author',
      isbn,
      coverUrl: bookData.cover?.large || bookData.cover?.medium,
      pageCount: bookData.number_of_pages,
      publishYear: bookData.publish_date ? parseInt(bookData.publish_date) : undefined,
      description: bookData.excerpts?.[0]?.text,
    };
  } catch (error) {
    console.error('Failed to fetch book by ISBN:', error);
    return null;
  }
}

/**
 * Search for book covers by title (fallback when ISBN is not available)
 * @param title - Book title
 * @returns Cover URL or null
 */
export async function searchBookCover(title: string): Promise<string | null> {
  try {
    const results = await searchBooks(title);
    if (results.length > 0 && results[0].coverUrl) {
      return results[0].coverUrl;
    }
    return null;
  } catch {
    return null;
  }
}

