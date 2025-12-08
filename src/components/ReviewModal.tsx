import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Quote, Edit3, Trash2, Plus, BookOpen, Bookmark, BookCheck, ChevronDown, Save, Search, RefreshCw, ExternalLink, Sparkles, ChevronUp } from 'lucide-react';
import { Book, Review, ReadingStatus, Shelf, getAverageRating, ReviewFormData, BookFormData } from '../types/book';
import { StarRating, RatingText } from './StarRating';
import { BookRecommendation, findSimilarBooks } from '../services/recommendationApi';

interface ReviewModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onEditBook: (bookId: string, updates: Partial<Book>) => void;
  onDeleteBook: (bookId: string) => void;
  onAddReview: (bookId: string, review: ReviewFormData) => void;
  onEditReview: (bookId: string, reviewId: string, updates: Partial<ReviewFormData>) => void;
  onDeleteReview: (bookId: string, reviewId: string) => void;
  onUpdateProgress: (bookId: string, progress: number) => void;
  onChangeStatus: (bookId: string, status: ReadingStatus) => void;
  allShelves: Shelf[];
  onAddBook?: (book: BookFormData) => void;
}

/**
 * Modal component displaying the full book details and reviews
 * Supports editing, deleting, and adding multiple reviews
 */
export function ReviewModal({ 
  book, 
  isOpen, 
  onClose,
  onEditBook,
  onDeleteBook,
  onAddReview,
  onEditReview,
  onDeleteReview,
  onUpdateProgress,
  onChangeStatus,
  allShelves,
  onAddBook,
}: ReviewModalProps) {
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  
  // New review form state
  const [newReview, setNewReview] = useState({ content: '', rating: 0 });
  
  // Edit book form state
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    tags: '',
    totalPages: '',
    shelf: '',
  });

  // Similar books state (Parallel AI)
  const [similarBooks, setSimilarBooks] = useState<BookRecommendation[]>([]);
  const [isSimilarBooksLoading, setIsSimilarBooksLoading] = useState(false);
  const [similarBooksError, setSimilarBooksError] = useState<string | null>(null);
  const [isSimilarBooksExpanded, setIsSimilarBooksExpanded] = useState(false);

  if (!book) return null;

  const avgRating = getAverageRating(book);
  const progressPercent = book.totalPages && book.progress
    ? Math.round((book.progress / book.totalPages) * 100)
    : 0;

  const handleStartEditBook = () => {
    setEditForm({
      title: book.title,
      author: book.author,
      tags: book.tags.join(', '),
      totalPages: book.totalPages?.toString() || '',
      shelf: book.shelf || '',
    });
    setIsEditingBook(true);
  };

  const handleSaveBookEdit = () => {
    onEditBook(book.id, {
      title: editForm.title,
      author: editForm.author,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t),
      totalPages: editForm.totalPages ? parseInt(editForm.totalPages) : undefined,
      // Pass null explicitly when no shelf is selected to allow removing from shelf
      shelf: editForm.shelf || null,
    });
    setIsEditingBook(false);
  };

  const handleAddReview = () => {
    if (newReview.content && newReview.rating > 0) {
      onAddReview(book.id, newReview);
      setNewReview({ content: '', rating: 0 });
      setIsAddingReview(false);
    }
  };

  const handleEditReview = (review: Review) => {
    onEditReview(book.id, review.id, {
      content: review.content,
      rating: review.rating,
    });
    setEditingReviewId(null);
  };

  const handleConfirmDeleteReview = () => {
    if (deleteReviewId) {
      onDeleteReview(book.id, deleteReviewId);
      setDeleteReviewId(null);
    }
  };

  const statusOptions: { value: ReadingStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'want_to_read', label: 'Want to Read', icon: <Bookmark className="w-4 h-4" /> },
    { value: 'reading', label: 'Currently Reading', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'read', label: 'Read', icon: <BookCheck className="w-4 h-4" /> },
  ];

  // Find similar books using Parallel AI
  const handleFindSimilarBooks = async () => {
    if (!book) return;
    
    setIsSimilarBooksLoading(true);
    setSimilarBooksError(null);
    setIsSimilarBooksExpanded(true);
    
    try {
      const response = await findSimilarBooks(book);
      setSimilarBooks(response.similarBooks);
    } catch (err) {
      console.error('Failed to find similar books:', err);
      setSimilarBooksError(err instanceof Error ? err.message : 'Failed to find similar books');
    } finally {
      setIsSimilarBooksLoading(false);
    }
  };

  // Add a similar book to the user's "Want to Read" list
  const handleAddSimilarBook = (similarBook: BookRecommendation) => {
    if (!onAddBook) return;
    
    onAddBook({
      title: similarBook.title,
      author: similarBook.author,
      rating: 0,
      review: '',
      tags: similarBook.genres.join(', '),
      status: 'want_to_read',
      coverUrl: similarBook.coverUrl,
    });
    
    // Remove from similar books list to show it's been added
    setSimilarBooks(prev => prev.filter(b => b.title !== similarBook.title));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-primary-900/40 backdrop-blur-cozy z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-cream rounded-cozy-lg shadow-cozy-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-primary-400 hover:text-primary-600 hover:bg-lavender rounded-full transition-all z-10"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header with book cover */}
              <div className="flex flex-col sm:flex-row gap-6 p-6 pb-4 border-b border-lavender">
                {/* Book cover */}
                <div className="flex-shrink-0 book-spine rounded-cozy overflow-hidden shadow-cozy">
                  <img
                    src={book.coverUrl}
                    alt={`Cover of ${book.title}`}
                    className="w-32 h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/150x220/635C7B/white?text=${encodeURIComponent(book.title.substring(0, 12))}`;
                    }}
                  />
                </div>

                {/* Book info */}
                <div className="flex-1 min-w-0">
                  {isEditingBook ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-lavender-dark rounded-cozy text-primary-800 font-serif text-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Title"
                      />
                      <input
                        type="text"
                        value={editForm.author}
                        onChange={(e) => setEditForm(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-lavender-dark rounded-cozy text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Author"
                      />
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-lavender-dark rounded-cozy text-primary-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Tags (comma separated)"
                      />
                      <input
                        type="number"
                        value={editForm.totalPages}
                        onChange={(e) => setEditForm(prev => ({ ...prev, totalPages: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-lavender-dark rounded-cozy text-primary-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Total pages"
                      />
                      {/* Custom Shelf Selector */}
                      {allShelves.filter(s => !['want_to_read', 'reading', 'read'].includes(s.id)).length > 0 && (
                        <div className="relative">
                          <select
                            value={editForm.shelf}
                            onChange={(e) => setEditForm(prev => ({ ...prev, shelf: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-lavender-dark rounded-cozy text-primary-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
                          >
                            <option value="">No custom shelf</option>
                            {allShelves
                              .filter(s => !['want_to_read', 'reading', 'read'].includes(s.id))
                              .map(shelf => (
                                <option key={shelf.id} value={shelf.id}>
                                  {shelf.name}
                                </option>
                              ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 pointer-events-none" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveBookEdit}
                          className="flex-1 py-2 bg-primary text-white rounded-cozy text-sm font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setIsEditingBook(false)}
                          className="flex-1 py-2 bg-lavender text-primary-600 rounded-cozy text-sm font-medium hover:bg-lavender-dark transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-serif text-2xl font-semibold text-primary-900 mb-2">
                          {book.title}
                        </h2>
                        <div className="flex gap-1">
                          <button
                            onClick={handleStartEditBook}
                            className="p-1.5 text-primary-400 hover:text-primary hover:bg-lavender rounded-full transition-all"
                            title="Edit book"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-1.5 text-primary-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Delete book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-primary-600 text-lg mb-4">
                        by {book.author}
                      </p>

                      {/* Rating */}
                      {book.reviews && book.reviews.length > 0 && (
                        <div className="flex items-center gap-3 mb-4">
                          <StarRating rating={avgRating} size="lg" />
                          <RatingText rating={avgRating} />
                          {book.reviews.length > 1 && (
                            <span className="text-sm text-primary-400">
                              ({book.reviews.length} reviews)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {book.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 bg-primary text-white text-sm rounded-full font-medium"
                          >
                            #{tag.replace(/\s+/g, '')}
                          </span>
                        ))}
                      </div>

                      {/* Reading Status Dropdown */}
                      <div className="relative">
                        <select
                          value={book.status}
                          onChange={(e) => onChangeStatus(book.id, e.target.value as ReadingStatus)}
                          className="w-full px-4 py-2.5 bg-white border border-lavender-dark rounded-cozy text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 pointer-events-none" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Reading Progress (for "reading" status) */}
              {book.status === 'reading' && book.totalPages && (
                <div className="px-6 py-4 border-b border-lavender bg-lavender-light/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary-700">Reading Progress</span>
                    <span className="text-sm text-primary-500">
                      {book.progress || 0} / {book.totalPages} pages ({progressPercent}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={book.totalPages}
                    value={book.progress || 0}
                    onChange={(e) => onUpdateProgress(book.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-lavender-dark rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>
              )}

              {/* Reviews section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Quote className="w-5 h-5 text-primary-400" />
                    <h3 className="font-serif text-lg font-medium text-primary-800">
                      My Reviews
                    </h3>
                  </div>
                  {!isAddingReview && (
                    <button
                      onClick={() => setIsAddingReview(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary hover:bg-lavender rounded-cozy transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Review
                    </button>
                  )}
                </div>

                {/* Add new review form */}
                {isAddingReview && (
                  <div className="mb-6 p-4 bg-lavender-light rounded-cozy">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={newReview.rating}
                          size="lg"
                          interactive
                          onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                        />
                        <span className="text-sm text-primary-500">
                          {newReview.rating > 0 ? `${newReview.rating}/5` : 'Click to rate'}
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={newReview.content}
                      onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts about this book..."
                      rows={4}
                      className="w-full px-3 py-2 bg-white border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAddReview}
                        disabled={!newReview.content || newReview.rating === 0}
                        className="flex-1 py-2 bg-primary text-white rounded-cozy text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Review
                      </button>
                      <button
                        onClick={() => { setIsAddingReview(false); setNewReview({ content: '', rating: 0 }); }}
                        className="flex-1 py-2 bg-white text-primary-600 rounded-cozy text-sm font-medium hover:bg-lavender transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing reviews */}
                {book.reviews && book.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {book.reviews
                      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                      .map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          isEditing={editingReviewId === review.id}
                          onStartEdit={() => setEditingReviewId(review.id)}
                          onSaveEdit={handleEditReview}
                          onCancelEdit={() => setEditingReviewId(null)}
                          onDelete={() => setDeleteReviewId(review.id)}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-primary-400 text-center py-8 italic">
                    No reviews yet. Share your thoughts about this book!
                  </p>
                )}
              </div>

              {/* Find Similar Books Section */}
              <div className="px-6 pb-4 border-t border-lavender">
                <button
                  onClick={() => setIsSimilarBooksExpanded(!isSimilarBooksExpanded)}
                  className="w-full py-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-serif text-lg font-medium text-primary-800">
                      Find Similar Books
                    </span>
                  </div>
                  {isSimilarBooksExpanded ? (
                    <ChevronUp className="w-5 h-5 text-primary-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary-400" />
                  )}
                </button>

                <AnimatePresence>
                  {isSimilarBooksExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* Search Button */}
                      {similarBooks.length === 0 && !isSimilarBooksLoading && (
                        <div className="text-center py-4">
                          <p className="text-primary-500 text-sm mb-4">
                            Discover books similar to "{book.title}" using AI-powered web search
                          </p>
                          <button
                            onClick={handleFindSimilarBooks}
                            className="px-6 py-2.5 bg-primary text-white rounded-cozy font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 mx-auto"
                          >
                            <Search className="w-4 h-4" />
                            Find Similar Books
                          </button>
                        </div>
                      )}

                      {/* Loading State */}
                      {isSimilarBooksLoading && (
                        <div className="text-center py-8">
                          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                          <p className="text-primary-500 text-sm">Searching the web for similar books...</p>
                        </div>
                      )}

                      {/* Error State */}
                      {similarBooksError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-cozy mb-4">
                          <p className="text-sm text-red-600">{similarBooksError}</p>
                          <button
                            onClick={handleFindSimilarBooks}
                            className="mt-2 text-sm text-red-700 underline hover:no-underline"
                          >
                            Try again
                          </button>
                        </div>
                      )}

                      {/* Similar Books Grid */}
                      {similarBooks.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-primary-500">
                              {similarBooks.length} similar book{similarBooks.length !== 1 ? 's' : ''} found
                            </span>
                            <button
                              onClick={handleFindSimilarBooks}
                              disabled={isSimilarBooksLoading}
                              className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSimilarBooksLoading ? 'animate-spin' : ''}`} />
                              Refresh
                            </button>
                          </div>
                          
                          {similarBooks.map((similarBook, index) => (
                            <motion.div
                              key={`${similarBook.title}-${index}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex gap-3 p-3 bg-lavender-light rounded-cozy"
                            >
                              {/* Cover */}
                              <img
                                src={similarBook.coverUrl || `https://placehold.co/60x90/635C7B/white?text=${encodeURIComponent(similarBook.title.substring(0, 6))}`}
                                alt={`Cover of ${similarBook.title}`}
                                className="w-12 h-18 object-cover rounded shadow-sm flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://placehold.co/60x90/635C7B/white?text=${encodeURIComponent(similarBook.title.substring(0, 6))}`;
                                }}
                              />
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-serif font-semibold text-primary-900 text-sm leading-tight">
                                  {similarBook.title}
                                </h4>
                                <p className="text-xs text-primary-600 mb-1">{similarBook.author}</p>
                                <p className="text-xs text-primary-500 italic line-clamp-2">
                                  {similarBook.reason}
                                </p>
                                {similarBook.genres.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {similarBook.genres.slice(0, 2).map(genre => (
                                      <span
                                        key={genre}
                                        className="px-1.5 py-0.5 bg-white text-primary-600 text-xs rounded"
                                      >
                                        {genre}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col gap-1 flex-shrink-0">
                                {onAddBook && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAddSimilarBook(similarBook);
                                    }}
                                    className="p-1.5 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                                    title="Add to Want to Read"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                                <a
                                  href={`https://www.amazon.com/s?k=${encodeURIComponent(similarBook.title + ' ' + similarBook.author)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 bg-white text-primary-600 rounded hover:bg-lavender transition-colors"
                                  title="View on Amazon"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-cozy font-medium transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Delete book confirmation */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-cozy-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-6 rounded-cozy-lg shadow-cozy-lg max-w-sm w-full"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                    >
                      <h4 className="font-serif text-lg font-semibold text-primary-900 mb-2">
                        Delete Book?
                      </h4>
                      <p className="text-primary-600 text-sm mb-4">
                        Are you sure you want to delete "{book.title}"? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="flex-1 py-2 bg-red-500 text-white rounded-cozy font-medium hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 bg-lavender text-primary-600 rounded-cozy font-medium hover:bg-lavender-dark transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delete review confirmation */}
              <AnimatePresence>
                {deleteReviewId && (
                  <motion.div
                    className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-cozy-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white p-6 rounded-cozy-lg shadow-cozy-lg max-w-sm w-full"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                    >
                      <h4 className="font-serif text-lg font-semibold text-primary-900 mb-2">
                        Delete Review?
                      </h4>
                      <p className="text-primary-600 text-sm mb-4">
                        Are you sure you want to delete this review? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleConfirmDeleteReview}
                          className="flex-1 py-2 bg-red-500 text-white rounded-cozy font-medium hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteReviewId(null)}
                          className="flex-1 py-2 bg-lavender text-primary-600 rounded-cozy font-medium hover:bg-lavender-dark transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ReviewCardProps {
  review: Review;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (review: Review) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function ReviewCard({ review, isEditing, onStartEdit, onSaveEdit, onCancelEdit, onDelete }: ReviewCardProps) {
  const [editContent, setEditContent] = useState(review.content);
  const [editRating, setEditRating] = useState(review.rating);

  const handleSave = () => {
    onSaveEdit({ ...review, content: editContent, rating: editRating });
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-lavender-light rounded-cozy">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <StarRating
              rating={editRating}
              size="md"
              interactive
              onRatingChange={setEditRating}
            />
            <span className="text-sm text-primary-500">{editRating}/5</span>
          </div>
        </div>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-white border border-lavender-dark rounded-cozy text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-primary text-white rounded-cozy text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="flex-1 py-2 bg-white text-primary-600 rounded-cozy text-sm font-medium hover:bg-lavender transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-lavender rounded-cozy group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          <span className="text-sm text-primary-500">{review.rating}/5</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onStartEdit}
            className="p-1 text-primary-400 hover:text-primary hover:bg-lavender rounded transition-all"
            title="Edit review"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-primary-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
            title="Delete review"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-primary-700 leading-relaxed italic">"{review.content}"</p>
      <div className="flex items-center gap-1 mt-2 text-primary-400 text-xs">
        <Calendar className="w-3 h-3" />
        <span>
          {new Date(review.dateAdded).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
}
