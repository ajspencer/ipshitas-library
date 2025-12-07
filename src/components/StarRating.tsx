import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

/**
 * Star rating display/input component
 * Shows filled and empty stars based on rating value
 * Can be interactive for form inputs
 */
export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const filled = index < Math.floor(rating);
        const halfFilled = !filled && index < rating;

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(index)}
            className={`
              ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
              focus:outline-none
            `}
          >
            <Star
              className={`
                ${sizeClasses[size]}
                ${filled || halfFilled ? 'text-primary fill-primary' : 'text-primary-200'}
                ${halfFilled ? 'opacity-60' : ''}
                transition-colors
              `}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Helper to display rating as text (e.g., "4.5/5" or "10/10")
 */
export function RatingText({ rating, showOutOf10 = false }: { rating: number; showOutOf10?: boolean }) {
  if (showOutOf10) {
    return (
      <span className="text-primary-600 font-medium">
        {(rating * 2).toFixed(0)}/10
      </span>
    );
  }
  return (
    <span className="text-primary-600 font-medium">
      {rating % 1 === 0 ? rating : rating.toFixed(1)}/5
    </span>
  );
}

