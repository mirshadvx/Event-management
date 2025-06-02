import React, { useState } from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating, onRatingChange, readonly = false, size = 24 }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    className={`cursor-pointer transition-colors duration-150 ${
                        star <= (hoverRating || rating) 
                            ? "fill-orange-400 text-orange-400 drop-shadow-sm" 
                            : "text-gray-600"
                    } ${readonly ? "cursor-default" : "hover:text-orange-300 hover:drop-shadow-md"}`}
                    onClick={() => !readonly && onRatingChange && onRatingChange(star)}
                    onMouseEnter={() => !readonly && setHoverRating(star)}
                    onMouseLeave={() => !readonly && setHoverRating(0)}
                />
            ))}
        </div>
    );
};

export default StarRating;