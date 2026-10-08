import React, { useState } from 'react';

const StarRating = ({ rating = 0, onRate = null, readOnly = false, size = 20 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (!readOnly && onRate) {
      onRate(value);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '4px', cursor: readOnly ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const activeRating = hoverRating || rating;
        const isFilled = star <= activeRating;

        return (
          <span
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            style={{
              fontSize: `${size}px`,
              color: isFilled ? '#FFD700' : '#E0E0E0',
              transition: 'color 0.2s ease-in-out',
              userSelect: 'none'
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;