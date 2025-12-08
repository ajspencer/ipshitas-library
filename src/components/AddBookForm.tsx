import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BookPlus, Search, Loader2 } from 'lucide-react';
import { BookFormData, Shelf } from '../types/book';
import { StarRating } from './StarRating';
import { searchBooks, OpenLibraryBook } from '../services/bookApi';

interface AddBookFormProps {
  onAddBook: (book: BookFormData) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allShelves: Shelf[];
}

/**
 * Floating action button and modal form for adding new books
 * Includes book search autocomplete and manual entry
 */
export function AddBookForm({ onAddBook, isOpen, onOpenChange, allShelves }: AddBookFormProps) {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    rating: 0,
    review: '',
    tags: '',
    status: 'want_to_read',
    totalPages: undefined,
    shelf: undefined,
    isbn: undefined,
    coverUrl: undefined,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const customShelves = allShelves.filter(s => !['all', 'want_to_read', 'reading', 'read'].includes(s.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.author) {
      onAddBook(formData);
      setFormData({ 
        title: '', 
        author: '', 
        rating: 0, 
        review: '', 
        tags: '',
        status: 'want_to_read',
        totalPages: undefined,
        shelf: undefined,
        isbn: undefined,
        coverUrl: undefined,
      });
      setSearchQuery('');
      setSearchResults([]);
      onOpenChange(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    try {
      const results = await searchBooks(query);
      setSearchResults(results.slice(0, 8));
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: OpenLibraryBook) => {
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      coverUrl: book.coverUrl,
      totalPages: book.pageCount,
      description: book.description,
    }));
    setSearchQuery(book.title);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-cozy-lg flex items-center justify-center z-30"
        onClick={() => onOpenChange(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Add new book"
      >
        <Plus className="w-7 h-7" />
      </motion.button>

      {/* Modal Form */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-primary-900/40 backdrop-blur-cozy z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Form Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-cream rounded-cozy-lg shadow-cozy-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-lavender">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lavender rounded-full flex items-center justify-center">
                      <BookPlus className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-serif text-xl font-semibold text-primary-900">
                      Add a New Book
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 text-primary-400 hover:text-primary-600 hover:bg-lavender rounded-full transition-all"
                    aria-label="Close form"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Book Search */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      Search for a book
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        placeholder="Search by title or author..."
                        className="w-full pl-10 pr-10 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 animate-spin" />
                      )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-lavender-dark rounded-cozy shadow-cozy-lg max-h-64 overflow-y-auto">
                        {searchResults.map((book, index) => (
                          <button
                            key={`${book.isbn}-${index}`}
                            type="button"
                            onClick={() => handleSelectBook(book)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-lavender-light transition-colors text-left border-b border-lavender last:border-b-0"
                          >
                            <img
                              src={book.coverUrl || `https://placehold.co/40x60/635C7B/white?text=📖`}
                              alt=""
                              className="w-10 h-14 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://placehold.co/40x60/635C7B/white?text=📖`;
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-primary-800 truncate">{book.title}</p>
                              <p className="text-sm text-primary-500 truncate">{book.author}</p>
                              {book.publishYear && (
                                <p className="text-xs text-primary-400">{book.publishYear}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-primary-400 text-xs mt-1">
                      Search to auto-fill, or enter manually below
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-primary-700 mb-1.5"
                    >
                      Book Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., The Brothers Karamazov"
                      className="w-full px-4 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label
                      htmlFor="author"
                      className="block text-sm font-medium text-primary-700 mb-1.5"
                    >
                      Author *
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Fyodor Dostoevsky"
                      className="w-full px-4 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Reading Status */}
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-primary-700 mb-1.5"
                    >
                      Reading Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="want_to_read">Want to Read</option>
                      <option value="reading">Currently Reading</option>
                      <option value="read">Read</option>
                    </select>
                  </div>

                  {/* Total Pages */}
                  <div>
                    <label
                      htmlFor="totalPages"
                      className="block text-sm font-medium text-primary-700 mb-1.5"
                    >
                      Total Pages
                    </label>
                    <input
                      type="number"
                      id="totalPages"
                      name="totalPages"
                      value={formData.totalPages || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        totalPages: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      placeholder="e.g., 400"
                      className="w-full px-4 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Rating (optional for want_to_read) */}
                  {formData.status !== 'want_to_read' && (
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center gap-3">
                        <StarRating
                          rating={formData.rating}
                          size="lg"
                          interactive
                          onRatingChange={(rating) =>
                            setFormData((prev) => ({ ...prev, rating }))
                          }
                        />
                        <span className="text-primary-500 text-sm">
                          {formData.rating > 0
                            ? `${formData.rating}/5 stars`
                            : 'Click to rate'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Review (optional for want_to_read) */}
                  {formData.status !== 'want_to_read' && (
                    <div>
                      <label
                        htmlFor="review"
                        className="block text-sm font-medium text-primary-700 mb-1.5"
                      >
                        Your Review
                      </label>
                      <textarea
                        id="review"
                        name="review"
                        value={formData.review}
                        onChange={handleChange}
                        rows={4}
                        placeholder="What did you think about this book?"
                        className="w-full px-4 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label
                      htmlFor="tags"
                      className="block text-sm font-medium text-primary-700 mb-1.5"
                    >
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="e.g., Fiction, Philosophy, Classic (comma separated)"
                      className="w-full px-4 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <p className="text-primary-400 text-xs mt-1">
                      Separate multiple tags with commas
                    </p>
                  </div>

                  {/* Custom Shelf */}
                  {customShelves.length > 0 && (
                    <div>
                      <label
                        htmlFor="shelf"
                        className="block text-sm font-medium text-primary-700 mb-1.5"
                      >
                        Add to Shelf
                      </label>
                      <select
                        id="shelf"
                        name="shelf"
                        value={formData.shelf || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-lavender-dark rounded-cozy text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="">No custom shelf</option>
                        {customShelves.map(shelf => (
                          <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    className="w-full py-3.5 bg-primary text-white rounded-cozy font-semibold text-lg shadow-cozy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02, backgroundColor: '#4a4560' }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!formData.title || !formData.author}
                  >
                    Add to Library ✨
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
