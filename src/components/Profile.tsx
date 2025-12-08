import { BookOpen, Heart, Sparkles, Star, BookMarked, TrendingUp } from 'lucide-react';
import { profileData } from '../data/initialBooks';
import { ReadingGoal } from '../types/book';

interface ProfileStats {
  read: number;
  reading: number;
  wantToRead: number;
  avgRating: number;
  totalPages: number;
}

interface ProfileProps {
  bookCount: number;
  stats: ProfileStats;
  readingGoal: ReadingGoal;
}

/**
 * Profile component displaying the library owner's information
 * Shows name, bio, and reading stats in a cozy card design
 */
export function Profile({ stats, readingGoal }: ProfileProps) {
  const goalProgress = Math.min((stats.read / readingGoal.target) * 100, 100);

  return (
    <div className="bg-white rounded-cozy-lg shadow-cozy p-6 mb-8">
      {/* Header with avatar and name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-lavender flex items-center justify-center text-3xl">
          {profileData.avatar}
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-primary-900">
            {profileData.libraryName}
          </h1>
          <p className="text-primary-400 text-sm flex items-center gap-1">
            <Heart className="w-3 h-3 fill-primary-300 text-primary-300" />
            Personal Reading Collection
          </p>
        </div>
      </div>

      {/* Bio section */}
      <p className="text-primary-700 text-sm leading-relaxed mb-4 italic">
        "{profileData.bio}"
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-lavender">
        <StatCard
          icon={<BookOpen className="w-4 h-4" />}
          label="Books Read"
          value={stats.read}
        />
        <StatCard
          icon={<BookMarked className="w-4 h-4" />}
          label="Reading"
          value={stats.reading}
        />
        <StatCard
          icon={<Star className="w-4 h-4" />}
          label="Avg Rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Pages Read"
          value={stats.totalPages.toLocaleString()}
        />
      </div>

      {/* Reading Status Breakdown */}
      <div className="mt-4 pt-4 border-t border-lavender">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-primary-500">
            <Sparkles className="w-4 h-4 inline mr-1" />
            {readingGoal.year} Reading Progress
          </span>
          <span className="font-medium text-primary-700">
            {stats.read} / {readingGoal.target} books ({Math.round(goalProgress)}%)
          </span>
        </div>
        <div className="w-full h-3 bg-lavender rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        {stats.wantToRead > 0 && (
          <p className="text-xs text-primary-400 mt-2">
            {stats.wantToRead} book{stats.wantToRead !== 1 ? 's' : ''} in your "Want to Read" list
          </p>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="text-center p-3 bg-lavender-light rounded-cozy">
      <div className="flex justify-center mb-1 text-primary-400">
        {icon}
      </div>
      <div className="text-lg font-semibold text-primary-800">{value}</div>
      <div className="text-xs text-primary-500">{label}</div>
    </div>
  );
}
