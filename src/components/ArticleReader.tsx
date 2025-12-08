import { useState, useMemo } from 'react';
import { FileText, Hash, BookOpen, Trash2, Link, Loader2, Settings2, ExternalLink, X, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ArticleEntry {
  id: string;
  title: string;
  url: string;
  text: string;
  wordCount: number;
  pageCount: number;
  dateAdded: Date;
}

const WORDS_PER_PAGE_DEFAULT = 250;

/**
 * Article Reader - paste article links and track word/page counts
 */
export function ArticleReader() {
  const [articles, setArticles] = useState<ArticleEntry[]>([]);
  const [articleUrl, setArticleUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExtracted, setLastExtracted] = useState<{
    url: string;
    title: string;
    text: string;
    wordCount: number;
    pageCount: number;
  } | null>(null);
  const [wordsPerPage, setWordsPerPage] = useState(WORDS_PER_PAGE_DEFAULT);
  const [showSettings, setShowSettings] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<ArticleEntry | null>(null);

  // Total stats
  const totalStats = useMemo(() => {
    const totalWords = articles.reduce((sum, a) => sum + a.wordCount, 0);
    const totalPages = articles.reduce((sum, a) => sum + a.pageCount, 0);
    return { totalWords, totalPages, articleCount: articles.length };
  }, [articles]);

  const handleExtract = async () => {
    if (!articleUrl.trim()) return;

    // Validate URL
    try {
      new URL(articleUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastExtracted(null);

    try {
      const response = await fetch(`${API_BASE}/api/articles/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: articleUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extract article');
      }

      const data = await response.json();
      
      // Recalculate pages based on user's words per page setting
      const pageCount = Math.ceil(data.wordCount / wordsPerPage);
      
      setLastExtracted({
        url: data.url,
        title: data.title || '',
        text: data.text,
        wordCount: data.wordCount,
        pageCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveArticle = () => {
    if (!lastExtracted) return;

    // Use the title from the API, or fallback to URL-based title
    let title = lastExtracted.title || 'Untitled Article';
    if (!lastExtracted.title) {
      try {
        const url = new URL(lastExtracted.url);
        title = url.hostname;
      } catch {
        // Keep default title
      }
    }

    const newArticle: ArticleEntry = {
      id: crypto.randomUUID(),
      title,
      url: lastExtracted.url,
      text: lastExtracted.text,
      wordCount: lastExtracted.wordCount,
      pageCount: lastExtracted.pageCount,
      dateAdded: new Date(),
    };

    setArticles(prev => [newArticle, ...prev]);
    setArticleUrl('');
    setLastExtracted(null);
  };

  const handleDeleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const handleClear = () => {
    setArticleUrl('');
    setLastExtracted(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-primary-900 mb-2">
          Article Reading Tracker
        </h1>
        <p className="text-primary-500">
          Paste article links to extract text, count words, and convert to page equivalents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-cozy p-4 shadow-cozy">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-800">{totalStats.articleCount}</p>
              <p className="text-sm text-primary-400">Articles Read</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-cozy p-4 shadow-cozy">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-800">{totalStats.totalWords.toLocaleString()}</p>
              <p className="text-sm text-primary-400">Total Words</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-cozy p-4 shadow-cozy">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-800">{totalStats.totalPages}</p>
              <p className="text-sm text-primary-400">Pages Equivalent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-cozy-lg shadow-cozy p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-primary-800">
            Extract Article
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-primary text-white' : 'text-primary-400 hover:bg-lavender-light'
            }`}
            title="Settings"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-lavender-light rounded-cozy">
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Words per page
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={wordsPerPage}
                onChange={(e) => setWordsPerPage(Math.max(1, parseInt(e.target.value) || 250))}
                className="w-24 px-3 py-2 bg-white border border-lavender-dark rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary"
                min="1"
              />
              <span className="text-sm text-primary-500">
                Standard: 250-300 words/page
              </span>
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Article URL
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-300" />
              <input
                type="url"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                placeholder="https://example.com/article..."
                className="w-full pl-10 pr-4 py-3 bg-cream border border-lavender-dark rounded-cozy text-primary-800 placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleExtract}
              disabled={!articleUrl.trim() || isLoading}
              className="px-6 py-3 bg-primary text-white rounded-cozy font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-cozy hover:shadow-cozy-hover flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract'
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-cozy text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Extracted Results */}
        {lastExtracted && (
          <div className="mb-4">
            {/* Stats */}
            <div className="p-4 bg-gradient-to-r from-lavender to-lavender-light rounded-cozy mb-4">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-800">{lastExtracted.wordCount.toLocaleString()}</p>
                  <p className="text-sm text-primary-500">words</p>
                </div>
                <div className="w-px h-12 bg-primary-200" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-800">{lastExtracted.pageCount}</p>
                  <p className="text-sm text-primary-500">
                    page{lastExtracted.pageCount !== 1 ? 's' : ''} ({wordsPerPage} words/page)
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-cream rounded-cozy border border-lavender-dark">
              <p className="text-xs text-primary-400 mb-2 font-medium">Preview:</p>
              <p className="text-sm text-primary-700 line-clamp-3">
                {lastExtracted.text.slice(0, 500)}...
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveArticle}
            disabled={!lastExtracted}
            className="flex-1 py-3 px-6 bg-primary text-white rounded-cozy font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-cozy hover:shadow-cozy-hover"
          >
            Save Article
          </button>
          <button
            onClick={handleClear}
            disabled={!articleUrl && !lastExtracted}
            className="py-3 px-6 bg-lavender text-primary-700 rounded-cozy font-medium hover:bg-lavender-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Saved Articles List */}
      {articles.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold text-primary-800 mb-4">
            Reading History
          </h2>
          <div className="space-y-3">
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="bg-white rounded-cozy shadow-cozy p-4 hover:shadow-cozy-hover transition-shadow animate-fade-in cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setPreviewArticle(article)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-primary-800 truncate group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-primary-400 truncate max-w-xs mt-1">
                      {new URL(article.url).hostname}
                    </p>
                    <p className="text-sm text-primary-400 mt-1">
                      {article.dateAdded.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-primary-700">
                        {article.wordCount.toLocaleString()} words
                      </p>
                      <p className="text-sm text-primary-400">
                        {article.pageCount} page{article.pageCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article.id);
                      }}
                      className="p-2 text-primary-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {articles.length === 0 && !lastExtracted && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-lavender rounded-full flex items-center justify-center mx-auto mb-4">
            <Link className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-serif text-xl text-primary-700 mb-2">
            No articles yet
          </h3>
          <p className="text-primary-400 max-w-sm mx-auto">
            Paste an article URL above to extract the text and see how many pages you've read!
          </p>
        </div>
      )}

      {/* Article Preview Modal */}
      {previewArticle && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewArticle(null)}
        >
          <div 
            className="bg-white rounded-cozy-lg shadow-cozy-lg max-w-3xl w-full max-h-[90vh] flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-lavender flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-2xl font-semibold text-primary-900 mb-2">
                    {previewArticle.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-primary-500">
                    <a 
                      href={previewArticle.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="truncate max-w-xs">View original</span>
                    </a>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {previewArticle.dateAdded.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewArticle(null)}
                  className="p-2 text-primary-400 hover:text-primary-700 hover:bg-lavender-light rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Stats Bar */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-lavender-light">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary-400" />
                  <span className="font-semibold text-primary-800">{previewArticle.wordCount.toLocaleString()}</span>
                  <span className="text-primary-400">words</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-400" />
                  <span className="font-semibold text-primary-800">{previewArticle.pageCount}</span>
                  <span className="text-primary-400">page{previewArticle.pageCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            {/* Modal Body - Article Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-primary max-w-none">
                {previewArticle.text.split('\n\n').map((paragraph, index) => {
                  // Check if it's a heading (starts with # or ##)
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h3 key={index} className="font-serif text-xl font-semibold text-primary-800 mt-6 mb-3">
                        {paragraph.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('# ')) {
                    return (
                      <h2 key={index} className="font-serif text-2xl font-semibold text-primary-900 mt-8 mb-4">
                        {paragraph.replace('# ', '')}
                      </h2>
                    );
                  }
                  // Skip empty paragraphs or very short ones (like single characters or just whitespace)
                  if (paragraph.trim().length < 3) return null;
                  // Skip navigation-like content
                  if (paragraph.includes('* * *') || paragraph.startsWith('* ')) return null;
                  
                  return (
                    <p key={index} className="text-primary-700 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-lavender flex-shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-6 py-2 bg-lavender text-primary-700 rounded-cozy font-medium hover:bg-lavender-dark transition-colors"
              >
                Close
              </button>
              <a
                href={previewArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-primary text-white rounded-cozy font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Read Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
