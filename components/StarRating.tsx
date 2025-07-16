import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  totalRatings?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export default function StarRating({ 
  rating = 0, 
  totalRatings = 0, 
  size = 'md',
  showCount = true 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showCount && totalRatings > 0 && (
        <span className="text-sm text-gray-600">
          ({totalRatings} avis)
        </span>
      )}
    </div>
  );
}
