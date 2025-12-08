import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Plus, ExternalLink, AlertCircle, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { Book, BookFormData } from '../types/book';
import { BookRecommendation, getRecommendations, checkApiHealth } from '../services/recommendationApi';

interface RecommendationsPanelProps {
  books: Book[];
  onAddBook: (book: BookFormData) => void;
}

/**
 * AI-powered book recommendations panel
 * Shows personalized suggestions based on user's reading history
 */
export function RecommendationsPanel({ books, onAddBook }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Check API availability on mount
  useEffect(() => {
    checkApiHealth().then(setApiAvailable);
  }, []);

  const handleGetRecommendations = async () => {
    if (books.length === 0) {
      setError('Add some books to your library first to get recommendations!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getRecommendations(books);
      setRecommendations(response.recommendations);
      setLastGenerated(new Date(response.generatedAt));
    } catch (err) {
      console.error('Failed to get recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWantToRead = (rec: BookRecommendation) => {
    onAddBook({
      title: rec.title,
      author: rec.author,
      rating: 0,
      review: '',
      tags: rec.genres.join(', '),
      status: 'want_to_read',
      totalPages: rec.estimatedPages,
      isbn: rec.isbn,
      coverUrl: rec.coverUrl,
    });
    
    // Remove from recommendations list
    setRecommendations(prev => prev.filter(r => r.title !== rec.title));
  };

  const readBooksCount = books.filter(b => b.status === 'read').length;

  return (
    <div className="bg-white rounded-cozy-lg shadow-cozy overflow-hidden mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-primary to-primary-light text-white"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <span className="font-serif text-lg font-semibold">AI Book Recommendations</span>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              {/* API Status Warning */}
              {apiAvailable === false && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-cozy flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Backend not running</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Start the backend server to get AI recommendations:
                      <code className="ml-2 px-2 py-0.5 bg-amber-100 rounded text-amber-800">
                        cd backend && npm install && npm run dev
                      </code>
                    </p>
                  </div>
                </div>
              )}

              {/* Powered by Parallel AI badge */}
              <div className="mb-4 flex items-center justify-center">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-lavender rounded-cozy text-sm font-medium text-primary-700">
                  <Globe className="w-3.5 h-3.5" />
                  Powered by Parallel AI
                </span>
              </div>

              {/* Get Recommendations Button */}
              {recommendations.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-lavender rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-primary-800 mb-2">
                    Discover Your Next Read
                  </h3>
                  <p className="text-primary-500 text-sm mb-6 max-w-md mx-auto">
                    {readBooksCount >= 3
                      ? `Based on ${readBooksCount} books you've read, Parallel AI will search the web to find your perfect next book.`
                      : 'Add more books to your library to get personalized recommendations based on your reading taste.'}
                  </p>
                  <button
                    onClick={handleGetRecommendations}
                    disabled={isLoading || apiAvailable === false}
                    className="px-6 py-3 bg-primary text-white rounded-cozy font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Finding books...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Get AI Recommendations
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-cozy flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Recommendations List */}
              {recommendations.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-primary-500">
                      {lastGenerated && (
                        <span>Generated {lastGenerated.toLocaleTimeString()}</span>
                      )}
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-lavender rounded text-xs">
                        <Globe className="w-3 h-3" />
                        Parallel AI
                      </span>
                    </div>
                    <button
                      onClick={handleGetRecommendations}
                      disabled={isLoading}
                      className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={`${rec.title}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-lavender-light rounded-cozy p-4 flex flex-col"
                      >
                        <div className="flex gap-3 mb-3">
                          {/* Cover */}
                          <img
                            src={rec.coverUrl || `https://placehold.co/80x120/635C7B/white?text=${encodeURIComponent(rec.title.substring(0, 8))}`}
                            alt={`Cover of ${rec.title}`}
                            className="w-16 h-24 object-cover rounded shadow-cozy flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/80x120/635C7B/white?text=${encodeURIComponent(rec.title.substring(0, 8))}`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif font-semibold text-primary-900 leading-tight mb-1">
                              {rec.title}
                            </h4>
                            <p className="text-sm text-primary-600 mb-2">{rec.author}</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.genres.slice(0, 2).map(genre => (
                                <span
                                  key={genre}
                                  className="px-2 py-0.5 bg-white text-primary-600 text-xs rounded-full"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-primary-700 italic mb-4 flex-1">
                          "{rec.reason}"
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToWantToRead(rec);
                            }}
                            className="flex-1 py-2 bg-primary text-white rounded-cozy text-sm font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Want to Read
                          </button>
                          <a
                            href={`https://www.amazon.com/s?k=${encodeURIComponent(rec.title + ' ' + rec.author)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white text-primary-600 rounded-cozy hover:bg-lavender transition-colors"
                            title="View on Amazon"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

