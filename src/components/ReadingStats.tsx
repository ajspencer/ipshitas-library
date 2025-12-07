import { useMemo } from 'react';
import { Book, getAverageRating } from '../types/book';
import { BarChart3, Star, BookOpen, TrendingUp, Calendar, Tag } from 'lucide-react';

interface ReadingStatsProps {
  books: Book[];
}

/**
 * Reading statistics dashboard component
 * Shows various metrics and visualizations about reading habits
 */
export function ReadingStats({ books }: ReadingStatsProps) {
  const stats = useMemo(() => {
    const readBooks = books.filter(b => b.status === 'read');
    const readingBooks = books.filter(b => b.status === 'reading');
    const wantToRead = books.filter(b => b.status === 'want_to_read');
    
    // Average rating
    const ratedBooks = readBooks.filter(b => b.reviews && b.reviews.length > 0);
    const avgRating = ratedBooks.length > 0
      ? ratedBooks.reduce((sum, b) => sum + getAverageRating(b), 0) / ratedBooks.length
      : 0;
    
    // Total pages
    const totalPages = readBooks
      .filter(b => b.totalPages)
      .reduce((sum, b) => sum + (b.totalPages || 0), 0);
    
    // Pages in progress
    const pagesInProgress = readingBooks
      .filter(b => b.progress)
      .reduce((sum, b) => sum + (b.progress || 0), 0);
    
    // Books by month (this year)
    const currentYear = new Date().getFullYear();
    const booksByMonth: Record<number, number> = {};
    for (let i = 0; i < 12; i++) {
      booksByMonth[i] = 0;
    }
    
    readBooks.forEach(book => {
      const date = new Date(book.dateAdded);
      if (date.getFullYear() === currentYear) {
        booksByMonth[date.getMonth()]++;
      }
    });
    
    // Top tags
    const tagCounts: Record<string, number> = {};
    books.forEach(book => {
      book.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Rating distribution
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedBooks.forEach(book => {
      const rating = Math.round(getAverageRating(book));
      if (rating >= 1 && rating <= 5) {
        ratingDist[rating]++;
      }
    });
    
    return {
      totalRead: readBooks.length,
      totalReading: readingBooks.length,
      totalWantToRead: wantToRead.length,
      avgRating,
      totalPages,
      pagesInProgress,
      booksByMonth,
      topTags,
      ratingDist,
      totalReviews: books.reduce((sum, b) => sum + (b.reviews?.length || 0), 0),
    };
  }, [books]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxBooksInMonth = Math.max(...Object.values(stats.booksByMonth), 1);
  const maxRatingCount = Math.max(...Object.values(stats.ratingDist), 1);

  return (
    <div className="bg-white rounded-cozy-lg shadow-cozy p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-xl font-semibold text-primary-900">
          Reading Statistics
        </h2>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickStat
          icon={<BookOpen className="w-5 h-5" />}
          label="Books Read"
          value={stats.totalRead}
          color="text-green-600 bg-green-50"
        />
        <QuickStat
          icon={<Star className="w-5 h-5" />}
          label="Avg Rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          color="text-amber-600 bg-amber-50"
        />
        <QuickStat
          icon={<TrendingUp className="w-5 h-5" />}
          label="Pages Read"
          value={stats.totalPages.toLocaleString()}
          color="text-blue-600 bg-blue-50"
        />
        <QuickStat
          icon={<Calendar className="w-5 h-5" />}
          label="Reviews"
          value={stats.totalReviews}
          color="text-purple-600 bg-purple-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Books by Month Chart */}
        <div>
          <h3 className="text-sm font-medium text-primary-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-400" />
            Books Read This Year
          </h3>
          <div className="flex items-end gap-1 h-32">
            {months.map((month, index) => {
              const count = stats.booksByMonth[index];
              const height = maxBooksInMonth > 0 ? (count / maxBooksInMonth) * 100 : 0;
              const currentMonth = new Date().getMonth();
              
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        index === currentMonth 
                          ? 'bg-primary' 
                          : count > 0 
                            ? 'bg-primary-300' 
                            : 'bg-lavender'
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${count} book${count !== 1 ? 's' : ''}`}
                    />
                    {count > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-primary-600">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-primary-400">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rating Distribution */}
        <div>
          <h3 className="text-sm font-medium text-primary-700 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary-400" />
            Rating Distribution
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDist[rating];
              const width = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-12 text-sm text-primary-600 flex items-center gap-1">
                    {rating} <Star className="w-3 h-3 fill-primary text-primary" />
                  </span>
                  <div className="flex-1 h-5 bg-lavender-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-6 text-sm text-primary-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-lavender">
          <h3 className="text-sm font-medium text-primary-700 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary-400" />
            Top Genres/Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-lavender text-primary-700 rounded-full text-sm font-medium flex items-center gap-1"
              >
                #{tag.replace(/\s+/g, '')}
                <span className="text-primary-400 text-xs">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function QuickStat({ icon, label, value, color }: QuickStatProps) {
  return (
    <div className="p-4 bg-lavender-light rounded-cozy">
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-primary-800">{value}</div>
      <div className="text-xs text-primary-500">{label}</div>
    </div>
  );
}

