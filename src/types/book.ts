/**
 * Reading status for a book
 */
export type ReadingStatus = 'want_to_read' | 'reading' | 'read';

/**
 * A single review entry for a book
 */
export interface Review {
  id: string;
  content: string;
  rating: number; // 1-5 scale
  dateAdded: string;
}

/**
 * Represents a book in Ipshita's Library
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  reviews: Review[]; // Multiple reviews per book
  tags: string[];
  coverUrl: string;
  dateAdded: string;
  // New fields for enhanced functionality
  status: ReadingStatus;
  progress?: number; // Pages read (for "reading" status)
  totalPages?: number;
  shelf?: string; // Custom shelf name
  isbn?: string; // For fetching real covers
  description?: string; // Book description from API
}

/**
 * Computed average rating from all reviews
 */
export function getAverageRating(book: Book): number {
  if (!book.reviews || book.reviews.length === 0) return 0;
  const sum = book.reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / book.reviews.length;
}

/**
 * Get the most recent review for display
 */
export function getLatestReview(book: Book): Review | null {
  if (!book.reviews || book.reviews.length === 0) return null;
  return book.reviews.reduce((latest, review) => 
    new Date(review.dateAdded) > new Date(latest.dateAdded) ? review : latest
  );
}

/**
 * Migrate old book format to new format
 * Handles conversion of `review` string to `reviews` array
 */
export function migrateBook(book: any): Book {
  // If already has reviews array, just ensure all fields exist
  if (Array.isArray(book.reviews)) {
    return {
      ...book,
      status: book.status || 'read',
      dateAdded: book.dateAdded || new Date().toISOString().split('T')[0],
    };
  }
  
  // Migrate from old format with `review` string
  const reviews: Review[] = [];
  if (book.review && typeof book.review === 'string' && book.review.trim()) {
    reviews.push({
      id: `migrated-${book.id}`,
      content: book.review,
      rating: book.rating || 0,
      dateAdded: book.dateAdded || new Date().toISOString().split('T')[0],
    });
  }
  
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    reviews,
    tags: book.tags || [],
    coverUrl: book.coverUrl,
    dateAdded: book.dateAdded || new Date().toISOString().split('T')[0],
    status: book.status || 'read',
    progress: book.progress,
    totalPages: book.totalPages,
    shelf: book.shelf,
    isbn: book.isbn,
    description: book.description,
  };
}

/**
 * Custom shelf for organizing books
 */
export interface Shelf {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Form data for adding a new book
 */
export interface BookFormData {
  title: string;
  author: string;
  rating: number;
  review: string;
  tags: string;
  status: ReadingStatus;
  totalPages?: number;
  shelf?: string;
  isbn?: string;
  coverUrl?: string;
  description?: string;
}

/**
 * Form data for adding a review to an existing book
 */
export interface ReviewFormData {
  content: string;
  rating: number;
}

/**
 * Reading goal for the year
 */
export interface ReadingGoal {
  year: number;
  target: number;
  current: number;
}
