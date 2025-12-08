import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Profile } from './components/Profile';
import { BookGrid } from './components/BookGrid';
import { ReviewModal } from './components/ReviewModal';
import { AddBookForm } from './components/AddBookForm';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ReadingStats } from './components/ReadingStats';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { Book, BookFormData, ReviewFormData, ReadingStatus, Shelf, ReadingGoal, getAverageRating } from './types/book';
import { defaultShelves } from './data/initialBooks';
import * as api from './services/api';

export type SortOption = 'dateAdded' | 'rating' | 'title' | 'author';
export type SortDirection = 'asc' | 'desc';

/**
 * Main App component - Ipshita's Library
 * A cozy personal book tracking application
 */
function App() {
  // Data state
  const [books, setBooks] = useState<Book[]>([]);
  const [customShelves, setCustomShelves] = useState<Shelf[]>([]);
  const [readingGoal, setReadingGoal] = useState<ReadingGoal>({
    year: new Date().getFullYear(),
    target: 24,
    current: 0,
  });

  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  
  // Filter/Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all');
  const [shelfFilter, setShelfFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Load initial data from API
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [booksData, shelvesData, goalData] = await Promise.all([
          api.fetchBooks(),
          api.fetchShelves(),
          api.fetchReadingGoal(),
        ]);

        setBooks(booksData);
        setCustomShelves(shelvesData.map(s => ({
          id: s.id,
          name: s.name,
          createdAt: s.createdAt,
        })));
        setReadingGoal(goalData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // All unique tags from books
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    books.forEach(book => book.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [books]);

  // All shelves (default + custom)
  const allShelves = useMemo(() => {
    return [...defaultShelves, ...customShelves];
  }, [customShelves]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(book => book.status === statusFilter);
    }

    // Shelf filter (for custom shelves)
    if (shelfFilter !== 'all' && !['want_to_read', 'reading', 'read'].includes(shelfFilter)) {
      result = result.filter(book => book.shelf === shelfFilter);
    } else if (['want_to_read', 'reading', 'read'].includes(shelfFilter)) {
      result = result.filter(book => book.status === shelfFilter);
    }

    // Tag filter
    if (tagFilter) {
      result = result.filter(book => book.tags.includes(tagFilter));
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dateAdded':
          comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
        case 'rating':
          comparison = getAverageRating(a) - getAverageRating(b);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [books, searchQuery, statusFilter, shelfFilter, tagFilter, sortBy, sortDirection]);

  // Stats
  const stats = useMemo(() => {
    const read = books.filter(b => b.status === 'read').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const wantToRead = books.filter(b => b.status === 'want_to_read').length;
    
    const readBooks = books.filter(b => b.status === 'read' && b.reviews && b.reviews.length > 0);
    const avgRating = readBooks.length > 0
      ? readBooks.reduce((sum, b) => sum + getAverageRating(b), 0) / readBooks.length
      : 0;
    
    const totalPages = books
      .filter(b => b.status === 'read' && b.totalPages)
      .reduce((sum, b) => sum + (b.totalPages || 0), 0);

    return { read, reading, wantToRead, avgRating, totalPages };
  }, [books]);

  // Handle clicking on a book card to view the review
  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  // Handle closing the review modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBook(null), 200);
  };

  // Handle adding a new book from the form
  const handleAddBook = useCallback(async (formData: BookFormData) => {
    try {
      const newBook = await api.createBook(formData);
      setBooks(prev => [newBook, ...prev]);
      
      // Sync reading goal if the book is marked as read
      if (formData.status === 'read') {
        const updatedGoal = await api.syncReadingGoal();
        setReadingGoal(updatedGoal);
      }
    } catch (err) {
      console.error('Failed to add book:', err);
      throw err;
    }
  }, []);

  // Handle editing a book
  const handleEditBook = useCallback(async (bookId: string, updates: Partial<Book>) => {
    try {
      const updatedBook = await api.updateBook(bookId, updates);
      setBooks(prev => prev.map(book => 
        book.id === bookId ? updatedBook : book
      ));
      // Update selected book if it's the one being edited
      if (selectedBook?.id === bookId) {
        setSelectedBook(updatedBook);
      }
      
      // Sync reading goal if status changed
      if (updates.status) {
        const updatedGoal = await api.syncReadingGoal();
        setReadingGoal(updatedGoal);
      }
    } catch (err) {
      console.error('Failed to update book:', err);
      throw err;
    }
  }, [selectedBook?.id]);

  // Handle deleting a book
  const handleDeleteBook = useCallback(async (bookId: string) => {
    try {
      await api.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
      handleCloseModal();
      
      // Sync reading goal
      const updatedGoal = await api.syncReadingGoal();
      setReadingGoal(updatedGoal);
    } catch (err) {
      console.error('Failed to delete book:', err);
      throw err;
    }
  }, []);

  // Handle adding a review to a book
  const handleAddReview = useCallback(async (bookId: string, reviewData: ReviewFormData) => {
    try {
      const newReview = await api.addReview(bookId, reviewData);
      
      setBooks(prev => prev.map(book => 
        book.id === bookId 
          ? { ...book, reviews: [...book.reviews, newReview] }
          : book
      ));
      
      // Update selected book
      if (selectedBook?.id === bookId) {
        setSelectedBook(prev => prev 
          ? { ...prev, reviews: [...prev.reviews, newReview] }
          : null
        );
      }
    } catch (err) {
      console.error('Failed to add review:', err);
      throw err;
    }
  }, [selectedBook?.id]);

  // Handle editing a review
  const handleEditReview = useCallback(async (bookId: string, reviewId: string, updates: Partial<ReviewFormData>) => {
    try {
      const updatedReview = await api.updateReview(bookId, reviewId, updates);
      
      setBooks(prev => prev.map(book => {
        if (book.id !== bookId) return book;
        return {
          ...book,
          reviews: book.reviews.map(review =>
            review.id === reviewId ? updatedReview : review
          )
        };
      }));
      
      // Update selected book
      if (selectedBook?.id === bookId) {
        setSelectedBook(prev => {
          if (!prev) return null;
          return {
            ...prev,
            reviews: prev.reviews.map(review =>
              review.id === reviewId ? updatedReview : review
            )
          };
        });
      }
    } catch (err) {
      console.error('Failed to update review:', err);
      throw err;
    }
  }, [selectedBook?.id]);

  // Handle deleting a review
  const handleDeleteReview = useCallback(async (bookId: string, reviewId: string) => {
    try {
      await api.deleteReview(bookId, reviewId);
      
      setBooks(prev => prev.map(book => {
        if (book.id !== bookId) return book;
        return {
          ...book,
          reviews: book.reviews.filter(review => review.id !== reviewId)
        };
      }));
      
      // Update selected book
      if (selectedBook?.id === bookId) {
        setSelectedBook(prev => {
          if (!prev) return null;
          return {
            ...prev,
            reviews: prev.reviews.filter(review => review.id !== reviewId)
          };
        });
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
      throw err;
    }
  }, [selectedBook?.id]);

  // Handle updating reading progress
  const handleUpdateProgress = useCallback(async (bookId: string, progress: number) => {
    await handleEditBook(bookId, { progress });
  }, [handleEditBook]);

  // Handle changing reading status
  const handleChangeStatus = useCallback(async (bookId: string, status: ReadingStatus) => {
    const book = books.find(b => b.id === bookId);
    const updates: Partial<Book> = { status };
    
    // If marking as read, set progress to total pages
    if (status === 'read' && book?.totalPages) {
      updates.progress = book.totalPages;
    }
    // If marking as want to read, clear progress
    if (status === 'want_to_read') {
      updates.progress = undefined;
    }
    
    await handleEditBook(bookId, updates);
  }, [books, handleEditBook]);

  // Handle creating a custom shelf
  const handleCreateShelf = useCallback(async (name: string) => {
    try {
      const newShelf = await api.createShelf(name);
      setCustomShelves(prev => [...prev, {
        id: newShelf.id,
        name: newShelf.name,
        createdAt: newShelf.createdAt,
      }]);
    } catch (err) {
      console.error('Failed to create shelf:', err);
      throw err;
    }
  }, []);

  // Handle deleting a custom shelf
  const handleDeleteShelf = useCallback(async (shelfId: string) => {
    try {
      await api.deleteShelf(shelfId);
      setCustomShelves(prev => prev.filter(s => s.id !== shelfId));
      // Update books that were on this shelf
      setBooks(prev => prev.map(book => 
        book.shelf === shelfId ? { ...book, shelf: undefined } : book
      ));
    } catch (err) {
      console.error('Failed to delete shelf:', err);
      throw err;
    }
  }, []);

  // Handle updating reading goal
  const handleUpdateGoal = useCallback(async (target: number) => {
    try {
      const updatedGoal = await api.updateReadingGoal(target);
      setReadingGoal(updatedGoal);
    } catch (err) {
      console.error('Failed to update goal:', err);
      throw err;
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-primary-900 mb-2">Something went wrong</h2>
          <p className="text-primary-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      customShelves={customShelves}
      allShelves={allShelves}
      books={books}
      shelfFilter={shelfFilter}
      onShelfSelect={setShelfFilter}
      onCreateShelf={handleCreateShelf}
      onDeleteShelf={handleDeleteShelf}
      readingGoal={readingGoal}
      onUpdateGoal={handleUpdateGoal}
    >
      {/* Profile section */}
      <Profile 
        bookCount={books.length} 
        stats={stats}
        readingGoal={readingGoal}
      />

      {/* AI Recommendations Panel */}
      <RecommendationsPanel books={books} onAddBook={handleAddBook} />

      {/* Reading Statistics */}
      <ReadingStats books={books} />

      {/* Search, Filter, Sort Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        shelfFilter={shelfFilter}
        onShelfFilterChange={setShelfFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        allTags={allTags}
        allShelves={allShelves}
      />

      {/* Section header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-primary-900 mb-1">
          {shelfFilter === 'all' ? 'My Reading Journey' : 
           shelfFilter === 'want_to_read' ? 'Want to Read' :
           shelfFilter === 'reading' ? 'Currently Reading' :
           shelfFilter === 'read' ? 'Books I\'ve Read' :
           allShelves.find(s => s.id === shelfFilter)?.name || 'My Books'}
        </h2>
        <p className="text-primary-500 text-sm">
          {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} 
          {searchQuery && ` matching "${searchQuery}"`}
          {tagFilter && ` tagged with "${tagFilter}"`}
        </p>
      </div>

      {/* Book grid */}
      <BookGrid 
        books={filteredBooks} 
        onBookClick={handleBookClick}
        isFiltered={!!(searchQuery || statusFilter !== 'all' || shelfFilter !== 'all' || tagFilter)}
      />

      {/* Review modal */}
      <ReviewModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEditBook={handleEditBook}
        onDeleteBook={handleDeleteBook}
        onAddReview={handleAddReview}
        onEditReview={handleEditReview}
        onDeleteReview={handleDeleteReview}
        onUpdateProgress={handleUpdateProgress}
        onChangeStatus={handleChangeStatus}
        allShelves={allShelves}
        onAddBook={handleAddBook}
      />

      {/* Add book floating button and form */}
      <AddBookForm 
        onAddBook={handleAddBook} 
        isOpen={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
        allShelves={allShelves}
      />
    </Layout>
  );
}

export default App;
