/**
 * Client-side API for fetching AI-powered book recommendations
 */

import { Book, getAverageRating } from '../types/book';

// VITE_API_URL from Render gives the base URL without /api suffix
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Ensure the URL has /api suffix
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
  genres: string[];
  estimatedPages?: number;
  isbn?: string;
  coverUrl?: string;
}

export interface RecommendationResponse {
  recommendations: BookRecommendation[];
  basedOn: number;
  generatedAt: string;
}

export interface RecommendationPreferences {
  favoriteGenres?: string[];
  avoidGenres?: string[];
  preferredLength?: 'short' | 'medium' | 'long';
}

export interface SimilarBooksResponse {
  similarBooks: BookRecommendation[];
  basedOn: {
    title: string;
    author: string;
  };
  generatedAt: string;
}

/**
 * Fetch personalized book recommendations based on user's library
 * Powered by Parallel AI
 * @param books - User's book library
 * @param preferences - Optional preferences to guide recommendations
 * @returns Array of book recommendations with reasons
 */
export async function getRecommendations(
  books: Book[],
  preferences?: RecommendationPreferences
): Promise<RecommendationResponse> {
  // Only send read books with reviews for better recommendations
  const readBooksWithReviews = books
    .filter(b => b.status === 'read' && b.reviews && b.reviews.length > 0)
    .map(b => ({
      title: b.title,
      author: b.author,
      rating: getAverageRating(b),
      tags: b.tags,
      review: b.reviews[b.reviews.length - 1]?.content, // Latest review
    }));

  // If no read books, include all books
  const booksToSend = readBooksWithReviews.length >= 3 
    ? readBooksWithReviews 
    : books.map(b => ({
        title: b.title,
        author: b.author,
        rating: getAverageRating(b),
        tags: b.tags,
        review: b.reviews?.[b.reviews.length - 1]?.content,
      }));

  const response = await fetch(`${API_BASE_URL}/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      books: booksToSend,
      preferences,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to get recommendations: ${response.status}`);
  }

  return response.json();
}

/**
 * Find books similar to a specific book using Parallel AI web search
 * @param book - The book to find similar books for
 * @returns Array of similar book suggestions
 */
export async function findSimilarBooks(book: Book): Promise<SimilarBooksResponse> {
  const response = await fetch(`${API_BASE_URL}/recommendations/similar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: book.title,
      author: book.author,
      genres: book.tags,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to find similar books: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if the recommendation API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

