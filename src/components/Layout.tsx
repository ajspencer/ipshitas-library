import { ReactNode, useState } from 'react';
import { BookMarked, Library, BookOpen, BookCheck, Bookmark, Plus, Trash2, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Book, Shelf, ReadingGoal } from '../types/book';

interface LayoutProps {
  children: ReactNode;
  customShelves: Shelf[];
  allShelves: Shelf[];
  books: Book[];
  shelfFilter: string;
  onShelfSelect: (shelfId: string) => void;
  onCreateShelf: (name: string) => void;
  onDeleteShelf: (shelfId: string) => void;
  readingGoal: ReadingGoal;
  onUpdateGoal: (target: number) => void;
}

/**
 * Main layout wrapper with sidebar navigation
 */
export function Layout({ 
  children, 
  customShelves,
  books,
  shelfFilter,
  onShelfSelect,
  onCreateShelf,
  onDeleteShelf,
  readingGoal,
  onUpdateGoal,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newShelfName, setNewShelfName] = useState('');
  const [isCreatingShelf, setIsCreatingShelf] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(readingGoal.target.toString());

  // Count books by status
  const statusCounts = {
    all: books.length,
    want_to_read: books.filter(b => b.status === 'want_to_read').length,
    reading: books.filter(b => b.status === 'reading').length,
    read: books.filter(b => b.status === 'read').length,
  };

  // Count books by custom shelf
  const shelfCounts: Record<string, number> = {};
  customShelves.forEach(shelf => {
    shelfCounts[shelf.id] = books.filter(b => b.shelf === shelf.id).length;
  });

  const handleCreateShelf = () => {
    if (newShelfName.trim()) {
      onCreateShelf(newShelfName.trim());
      setNewShelfName('');
      setIsCreatingShelf(false);
    }
  };

  const handleGoalSubmit = () => {
    const newTarget = parseInt(goalInput);
    if (!isNaN(newTarget) && newTarget > 0) {
      onUpdateGoal(newTarget);
    }
    setIsEditingGoal(false);
  };

  const goalProgress = Math.min((statusCounts.read / readingGoal.target) * 100, 100);

  return (
    <div className="min-h-screen bg-cream">
      {/* Decorative header bar */}
      <header className="bg-primary py-4 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-lavender-light hover:text-white transition-colors lg:hidden"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <BookMarked className="w-6 h-6 text-lavender-light" />
          <span className="font-serif text-lavender-light text-lg tracking-wide">
            A Cozy Reading Nook
          </span>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'w-64' : 'w-0 lg:w-64'} 
          transition-all duration-300 overflow-hidden
          bg-white shadow-cozy border-r border-lavender
          sticky top-[60px] h-[calc(100vh-60px)]
          flex-shrink-0
        `}>
          <div className="p-4 h-full overflow-y-auto">
            {/* Reading Goal */}
            <div className="mb-6 p-3 bg-lavender-light rounded-cozy">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary-700">{readingGoal.year} Goal</span>
                </div>
                <button
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-xs text-primary-500 hover:text-primary transition-colors"
                >
                  Edit
                </button>
              </div>
              
              {isEditingGoal ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-white border border-lavender-dark rounded text-primary-800 focus:outline-none focus:ring-1 focus:ring-primary"
                    min="1"
                  />
                  <button
                    onClick={handleGoalSubmit}
                    className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-lg font-semibold text-primary-800">
                    {statusCounts.read} / {readingGoal.target} books
                  </div>
                  <div className="w-full h-2 bg-lavender-dark rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-primary-500 mt-1">
                    {goalProgress >= 100 ? 'Goal reached! 🎉' : `${Math.round(goalProgress)}% complete`}
                  </p>
                </>
              )}
            </div>

            {/* Main Shelves */}
            <nav className="space-y-1 mb-6">
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2 px-2">
                Library
              </p>
              
              <ShelfButton
                icon={<Library className="w-4 h-4" />}
                label="All Books"
                count={statusCounts.all}
                active={shelfFilter === 'all'}
                onClick={() => onShelfSelect('all')}
              />
              <ShelfButton
                icon={<Bookmark className="w-4 h-4" />}
                label="Want to Read"
                count={statusCounts.want_to_read}
                active={shelfFilter === 'want_to_read'}
                onClick={() => onShelfSelect('want_to_read')}
              />
              <ShelfButton
                icon={<BookOpen className="w-4 h-4" />}
                label="Currently Reading"
                count={statusCounts.reading}
                active={shelfFilter === 'reading'}
                onClick={() => onShelfSelect('reading')}
              />
              <ShelfButton
                icon={<BookCheck className="w-4 h-4" />}
                label="Read"
                count={statusCounts.read}
                active={shelfFilter === 'read'}
                onClick={() => onShelfSelect('read')}
              />
            </nav>

            {/* Custom Shelves */}
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider">
                  Custom Shelves
                </p>
                <button
                  onClick={() => setIsCreatingShelf(true)}
                  className="p-1 text-primary-400 hover:text-primary hover:bg-lavender rounded transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isCreatingShelf && (
                <div className="mb-2 px-2">
                  <input
                    type="text"
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateShelf()}
                    placeholder="Shelf name..."
                    className="w-full px-2 py-1.5 text-sm bg-cream border border-lavender-dark rounded text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={handleCreateShelf}
                      className="flex-1 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setIsCreatingShelf(false); setNewShelfName(''); }}
                      className="flex-1 py-1 text-xs bg-lavender text-primary-600 rounded hover:bg-lavender-dark transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <nav className="space-y-1">
                {customShelves.map(shelf => (
                  <div key={shelf.id} className="group flex items-center">
                    <ShelfButton
                      icon={<Library className="w-4 h-4" />}
                      label={shelf.name}
                      count={shelfCounts[shelf.id] || 0}
                      active={shelfFilter === shelf.id}
                      onClick={() => onShelfSelect(shelf.id)}
                      className="flex-1"
                    />
                    <button
                      onClick={() => onDeleteShelf(shelf.id)}
                      className="p-1 text-primary-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete shelf"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {customShelves.length === 0 && !isCreatingShelf && (
                  <p className="text-xs text-primary-300 px-2 py-2 italic">
                    No custom shelves yet
                  </p>
                )}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 px-4 py-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-primary-400 text-sm">
        <p className="font-serif italic">
          Made with 💜 for a book lover
        </p>
      </footer>
    </div>
  );
}

interface ShelfButtonProps {
  icon: ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  className?: string;
}

function ShelfButton({ icon, label, count, active, onClick, className = '' }: ShelfButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-cozy text-left transition-all
        ${active 
          ? 'bg-primary text-white' 
          : 'text-primary-600 hover:bg-lavender-light'
        }
        ${className}
      `}
    >
      <span className={active ? 'text-white' : 'text-primary-400'}>{icon}</span>
      <span className="flex-1 text-sm font-medium truncate">{label}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
        active ? 'bg-white/20 text-white' : 'bg-lavender text-primary-500'
      }`}>
        {count}
      </span>
    </button>
  );
}
