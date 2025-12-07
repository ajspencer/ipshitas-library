import { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Profile } from './components/Profile';
import { BookGrid } from './components/BookGrid';
import { ReviewModal } from './components/ReviewModal';
import { AddBookForm } from './components/AddBookForm';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ReadingStats } from './components/ReadingStats';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { Book, BookFormData, ReviewFormData, ReadingStatus, Shelf, ReadingGoal, getAverageRating, migrateBook } from './types/book';
import { initialBooks, defaultShelves, initialReadingGoal } from './data/initialBooks';

// LocalStorage keys for persisting data
const STORAGE_KEY = 'ipshitas-library-books';
const SHELVES_KEY = 'ipshitas-library-shelves';
const GOAL_KEY = 'ipshitas-library-goal';

export type SortOption = 'dateAdded' | 'rating' | 'title' | 'author';
export type SortDirection = 'asc' | 'desc';

/**
 * Main App component - Ipshita's Library
 * A cozy personal book tracking application
 */
function App() {
  // Initialize books from localStorage or use initial data
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old format books to new format
        const migratedBooks = parsed.map((b: any) => migrateBook(b));
        // Merge with initial books to ensure we always have the base data
        const savedIds = new Set(migratedBooks.map((b: Book) => b.id));
        const missingInitial = initialBooks.filter(b => !savedIds.has(b.id));
        return [...migratedBooks, ...missingInitial];
      }
    } catch (error) {
      console.warn('Failed to load books from localStorage:', error);
    }
    return initialBooks;
  });

  // Custom shelves
  const [customShelves, setCustomShelves] = useState<Shelf[]>(() => {
    try {
      const saved = localStorage.getItem(SHELVES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.warn('Failed to load shelves from localStorage:', error);
    }
    return [];
  });

  // Reading goal
  const [readingGoal, setReadingGoal] = useState<ReadingGoal>(() => {
    try {
      const saved = localStorage.getItem(GOAL_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.warn('Failed to load goal from localStorage:', error);
    }
    return initialReadingGoal;
  });

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

  // Persist books to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.warn('Failed to save books to localStorage:', error);
    }
  }, [books]);

  // Persist shelves
  useEffect(() => {
    try {
      localStorage.setItem(SHELVES_KEY, JSON.stringify(customShelves));
    } catch (error) {
      console.warn('Failed to save shelves to localStorage:', error);
    }
  }, [customShelves]);

  // Persist reading goal
  useEffect(() => {
    try {
      localStorage.setItem(GOAL_KEY, JSON.stringify(readingGoal));
    } catch (error) {
      console.warn('Failed to save goal to localStorage:', error);
    }
  }, [readingGoal]);

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
  const handleAddBook = (formData: BookFormData) => {
    const newBook: Book = {
      id: `user-${Date.now()}`,
      title: formData.title,
      author: formData.author,
      reviews: formData.review ? [{
        id: `review-${Date.now()}`,
        content: formData.review,
        rating: formData.rating,
        dateAdded: new Date().toISOString().split('T')[0],
      }] : [],
      tags: formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      coverUrl: formData.coverUrl || `https://placehold.co/150x220/635C7B/white?text=${encodeURIComponent(
        formData.title.substring(0, 12)
      )}`,
      dateAdded: new Date().toISOString().split('T')[0],
      status: formData.status,
      totalPages: formData.totalPages,
      shelf: formData.shelf,
      isbn: formData.isbn,
      description: formData.description,
    };

    setBooks((prev) => [newBook, ...prev]);
  };

  // Handle editing a book
  const handleEditBook = (bookId: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(book => 
      book.id === bookId ? { ...book, ...updates } : book
    ));
    // Update selected book if it's the one being edited
    if (selectedBook?.id === bookId) {
      setSelectedBook(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Handle deleting a book
  const handleDeleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(book => book.id !== bookId));
    handleCloseModal();
  };

  // Handle adding a review to a book
  const handleAddReview = (bookId: string, reviewData: ReviewFormData) => {
    const newReview = {
      id: `review-${Date.now()}`,
      content: reviewData.content,
      rating: reviewData.rating,
      dateAdded: new Date().toISOString().split('T')[0],
    };
    
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
  };

  // Handle editing a review
  const handleEditReview = (bookId: string, reviewId: string, updates: Partial<ReviewFormData>) => {
    setBooks(prev => prev.map(book => {
      if (book.id !== bookId) return book;
      return {
        ...book,
        reviews: book.reviews.map(review =>
          review.id === reviewId
            ? { ...review, ...updates }
            : review
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
            review.id === reviewId
              ? { ...review, ...updates }
              : review
          )
        };
      });
    }
  };

  // Handle deleting a review
  const handleDeleteReview = (bookId: string, reviewId: string) => {
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
  };

  // Handle updating reading progress
  const handleUpdateProgress = (bookId: string, progress: number) => {
    handleEditBook(bookId, { progress });
  };

  // Handle changing reading status
  const handleChangeStatus = (bookId: string, status: ReadingStatus) => {
    const updates: Partial<Book> = { status };
    const book = books.find(b => b.id === bookId);
    
    // If marking as read, set progress to total pages
    if (status === 'read' && book?.totalPages) {
      updates.progress = book.totalPages;
    }
    // If marking as want to read, clear progress
    if (status === 'want_to_read') {
      updates.progress = undefined;
    }
    
    handleEditBook(bookId, updates);
  };

  // Handle creating a custom shelf
  const handleCreateShelf = (name: string) => {
    const newShelf: Shelf = {
      id: `shelf-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    setCustomShelves(prev => [...prev, newShelf]);
  };

  // Handle deleting a custom shelf
  const handleDeleteShelf = (shelfId: string) => {
    setCustomShelves(prev => prev.filter(s => s.id !== shelfId));
    // Remove shelf from books
    setBooks(prev => prev.map(book => 
      book.shelf === shelfId ? { ...book, shelf: undefined } : book
    ));
  };

  // Handle updating reading goal
  const handleUpdateGoal = (target: number) => {
    setReadingGoal(prev => ({ ...prev, target }));
  };

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
