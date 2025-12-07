import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { ReadingStatus, Shelf } from '../types/book';
import { SortOption, SortDirection } from '../App';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ReadingStatus | 'all';
  onStatusFilterChange: (status: ReadingStatus | 'all') => void;
  shelfFilter: string;
  onShelfFilterChange: (shelf: string) => void;
  tagFilter: string | null;
  onTagFilterChange: (tag: string | null) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  allTags: string[];
  allShelves: Shelf[];
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  allTags,
}: SearchFilterBarProps) {
  const statusOptions: { value: ReadingStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Books' },
    { value: 'want_to_read', label: 'Want to Read' },
    { value: 'reading', label: 'Reading' },
    { value: 'read', label: 'Read' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'dateAdded', label: 'Date Added' },
    { value: 'rating', label: 'Rating' },
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
  ];

  return (
    <div className="bg-white rounded-cozy-lg shadow-cozy p-4 mb-6">
      {/* Search and main controls row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search books, authors, or tags..."
            className="w-full pl-10 pr-10 py-2.5 bg-cream border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-primary-400 hover:text-primary-600 rounded-full hover:bg-lavender transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ReadingStatus | 'all')}
            className="px-3 py-2.5 bg-cream border border-lavender-dark rounded-cozy text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            className="px-3 py-2.5 bg-cream border border-lavender-dark rounded-cozy text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
            className={`p-2.5 bg-cream border border-lavender-dark rounded-cozy text-primary-600 hover:bg-lavender transition-all ${
              sortDirection === 'desc' ? 'rotate-180' : ''
            }`}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-primary-400 py-1">Filter by tag:</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagFilterChange(tagFilter === tag ? null : tag)}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-all ${
                tagFilter === tag
                  ? 'bg-primary text-white'
                  : 'bg-lavender text-primary-600 hover:bg-lavender-dark'
              }`}
            >
              #{tag.replace(/\s+/g, '')}
            </button>
          ))}
          {tagFilter && (
            <button
              onClick={() => onTagFilterChange(null)}
              className="px-2.5 py-1 text-xs rounded-full font-medium bg-primary-100 text-primary-600 hover:bg-primary-200 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

