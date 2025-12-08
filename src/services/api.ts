/**
 * API service for communicating with the backend
 */

// VITE_API_URL from Render gives the base URL without /api suffix
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Ensure the URL has /api suffix
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============ Books API ============

import type { Book, BookFormData, ReviewFormData } from '../types/book';

export async function fetchBooks(): Promise<Book[]> {
  return fetchApi<Book[]>('/books');
}

export async function fetchBook(id: string): Promise<Book> {
  return fetchApi<Book>(`/books/${id}`);
}

export async function createBook(data: BookFormData): Promise<Book> {
  return fetchApi<Book>('/books', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      author: data.author,
      tags: data.tags,
      status: data.status,
      totalPages: data.totalPages,
      shelf: data.shelf,
      isbn: data.isbn,
      coverUrl: data.coverUrl,
      description: data.description,
      review: data.review,
      rating: data.rating,
    }),
  });
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<Book> {
  return fetchApi<Book>(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteBook(id: string): Promise<void> {
  return fetchApi<void>(`/books/${id}`, { method: 'DELETE' });
}

// ============ Reviews API ============

export async function addReview(bookId: string, data: ReviewFormData): Promise<{ id: string; content: string; rating: number; dateAdded: string }> {
  return fetchApi(`/books/${bookId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReview(
  bookId: string,
  reviewId: string,
  updates: Partial<ReviewFormData>
): Promise<{ id: string; content: string; rating: number; dateAdded: string }> {
  return fetchApi(`/books/${bookId}/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteReview(bookId: string, reviewId: string): Promise<void> {
  return fetchApi<void>(`/books/${bookId}/reviews/${reviewId}`, { method: 'DELETE' });
}

// ============ Shelves API ============

export interface ShelfWithCount {
  id: string;
  name: string;
  createdAt: string;
  bookCount: number;
}

export async function fetchShelves(): Promise<ShelfWithCount[]> {
  return fetchApi<ShelfWithCount[]>('/shelves');
}

export async function createShelf(name: string): Promise<ShelfWithCount> {
  return fetchApi<ShelfWithCount>('/shelves', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateShelf(id: string, name: string): Promise<ShelfWithCount> {
  return fetchApi<ShelfWithCount>(`/shelves/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function deleteShelf(id: string): Promise<void> {
  return fetchApi<void>(`/shelves/${id}`, { method: 'DELETE' });
}

// ============ Reading Goal API ============

export interface ReadingGoalData {
  year: number;
  target: number;
  current: number;
}

export async function fetchReadingGoal(): Promise<ReadingGoalData> {
  return fetchApi<ReadingGoalData>('/reading-goal');
}

export async function updateReadingGoal(target: number): Promise<ReadingGoalData> {
  return fetchApi<ReadingGoalData>('/reading-goal', {
    method: 'PUT',
    body: JSON.stringify({ target }),
  });
}

export async function syncReadingGoal(): Promise<ReadingGoalData> {
  return fetchApi<ReadingGoalData>('/reading-goal/sync', { method: 'POST' });
}

// ============ Profile API ============

export interface ProfileData {
  name: string;
  libraryName: string;
  bio: string;
  avatar: string;
}

export async function fetchProfile(): Promise<ProfileData> {
  return fetchApi<ProfileData>('/profile');
}

export async function updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  return fetchApi<ProfileData>('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

