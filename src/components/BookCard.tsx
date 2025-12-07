import { motion } from 'framer-motion';
import { BookOpen, Bookmark, BookCheck } from 'lucide-react';
import { Book, getAverageRating, getLatestReview } from '../types/book';
import { StarRating } from './StarRating';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

/**
 * Individual book card component with cover, title, author, rating, and tags
 * Features a "spine effect" on the cover and cozy hover animations
 */
export function BookCard({ book, onClick }: BookCardProps) {
  const avgRating = getAverageRating(book);
  const latestReview = getLatestReview(book);

  const statusIcon = {
    want_to_read: <Bookmark className="w-3 h-3" />,
    reading: <BookOpen className="w-3 h-3" />,
    read: <BookCheck className="w-3 h-3" />,
  };

  const statusLabel = {
    want_to_read: 'Want to Read',
    reading: 'Reading',
    read: 'Read',
  };

  const statusColor = {
    want_to_read: 'bg-amber-100 text-amber-700',
    reading: 'bg-blue-100 text-blue-700',
    read: 'bg-green-100 text-green-700',
  };

  // Calculate reading progress percentage
  const progressPercent = book.status === 'reading' && book.totalPages && book.progress
    ? Math.round((book.progress / book.totalPages) * 100)
    : null;

  return (
    <motion.article
      className="bg-white rounded-cozy-lg shadow-cozy overflow-hidden cursor-pointer group mb-6 break-inside-avoid"
      onClick={() => onClick(book)}
      whileHover={{ 
        y: -4,
        boxShadow: '0 12px 40px -4px rgba(99, 92, 123, 0.2), 0 6px 16px -2px rgba(99, 92, 123, 0.12)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      layout
    >
      {/* Book cover with spine effect */}
      <div className="relative overflow-hidden">
        <div className="book-spine">
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to placeholder if cover fails to load
              (e.target as HTMLImageElement).src = `https://placehold.co/150x220/635C7B/white?text=${encodeURIComponent(book.title.substring(0, 12))}`;
            }}
          />
        </div>
        
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor[book.status]}`}>
          {statusIcon[book.status]}
          <span className="hidden sm:inline">{statusLabel[book.status]}</span>
        </div>

        {/* Reading progress bar for "reading" status */}
        {book.status === 'reading' && progressPercent !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-100">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <span className="text-white text-sm font-medium px-4 py-1.5 bg-primary/80 rounded-full">
            {book.reviews?.length > 0 ? 'Read Review' : 'View Details'}
          </span>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-serif text-lg font-semibold text-primary-900 mb-1 leading-tight group-hover:text-primary transition-colors">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-primary-500 text-sm mb-3">
          by {book.author}
        </p>

        {/* Rating - only show if there are reviews */}
        {book.reviews && book.reviews.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={avgRating} size="sm" />
            <span className="text-primary-400 text-xs">
              ({avgRating % 1 === 0 ? avgRating : avgRating.toFixed(1)}/5)
            </span>
            {book.reviews.length > 1 && (
              <span className="text-primary-300 text-xs">
                ({book.reviews.length} reviews)
              </span>
            )}
          </div>
        )}

        {/* Progress for reading books */}
        {book.status === 'reading' && book.totalPages && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-primary-500 mb-1">
              <span>{book.progress || 0} of {book.totalPages} pages</span>
              {progressPercent !== null && <span>{progressPercent}%</span>}
            </div>
          </div>
        )}

        {/* Review snippet - show latest review */}
        {latestReview && (
          <p className="text-primary-600 text-sm leading-relaxed line-clamp-2 mb-3">
            {latestReview.content}
          </p>
        )}

        {/* No review placeholder */}
        {(!book.reviews || book.reviews.length === 0) && book.status !== 'want_to_read' && (
          <p className="text-primary-400 text-sm italic mb-3">
            No review yet
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {book.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-lavender text-primary-600 text-xs rounded-full font-medium"
            >
              #{tag.replace(/\s+/g, '')}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
