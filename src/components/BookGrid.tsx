import { motion } from 'framer-motion';
import { BookOpen, Search, Filter } from 'lucide-react';
import { Book } from '../types/book';
import { BookCard } from './BookCard';

interface BookGridProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  emptyMessage?: string;
  emptySubtext?: string;
  isFiltered?: boolean;
}

/**
 * Masonry-style grid layout for displaying book cards
 * Uses CSS columns for a Pinterest-like staggered layout
 */
export function BookGrid({ 
  books, 
  onBookClick, 
  emptyMessage,
  emptySubtext,
  isFiltered = false,
}: BookGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  if (books.length === 0) {
    return (
      <motion.div 
        className="text-center py-16"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-20 h-20 mx-auto mb-4 bg-lavender-light rounded-full flex items-center justify-center">
          {isFiltered ? (
            <Search className="w-10 h-10 text-primary-300" />
          ) : (
            <BookOpen className="w-10 h-10 text-primary-300" />
          )}
        </div>
        <p className="text-primary-500 font-serif text-xl mb-2">
          {emptyMessage || (isFiltered ? 'No books found' : 'No books in your library yet...')}
        </p>
        <p className="text-primary-400 text-sm max-w-md mx-auto">
          {emptySubtext || (isFiltered 
            ? 'Try adjusting your search or filters to find what you\'re looking for.'
            : 'Click the + button to add your first book and start tracking your reading journey!'
          )}
        </p>
        {isFiltered && (
          <div className="mt-4 flex items-center justify-center gap-2 text-primary-400 text-sm">
            <Filter className="w-4 h-4" />
            <span>Clear filters to see all books</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="columns-1 md:columns-2 lg:columns-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      key={books.map(b => b.id).join('-')} // Re-animate on filter change
    >
      {books.map((book) => (
        <motion.div key={book.id} variants={itemVariants} layout>
          <BookCard book={book} onClick={onBookClick} />
        </motion.div>
      ))}
    </motion.div>
  );
}
