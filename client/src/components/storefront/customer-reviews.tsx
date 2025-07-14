import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Star, User } from "lucide-react";
import { CustomerReview } from "@shared/schema";
import { useState } from "react";

interface CustomerReviewsProps {
  productId?: string;
  limit?: number;
  showAll?: boolean;
}

export default function CustomerReviews({ productId, limit = 6, showAll: showAllProp = false }: CustomerReviewsProps) {
  const [showAll, setShowAll] = useState(showAllProp);
  const { data, isLoading } = useQuery<{ reviews: CustomerReview[]; total: number }>({
    queryKey: ['/api/reviews', { isVisible: true, productId, limit: showAll ? undefined : limit, offset: 0, showAll }],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Customer Reviews</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const reviews = data?.reviews || [];

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">Be the first to review our products!</p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
            <p className="text-lg text-gray-600">See what our customers say about our garage doors</p>
            {data?.total && (
              <p className="text-sm text-gray-500 mt-2">
                Showing {reviews.length} of {data.total} reviews
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, showAll ? reviews.length : limit).map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                        {review.isVerified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>

                  <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
                  <p className="text-gray-700 mb-4 line-clamp-4">{review.comment}</p>

                  {review.adminResponse && (
                    <div className="bg-blue-50 p-3 rounded-lg mt-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">Response from Geelong Garage Doors:</p>
                      <p className="text-sm text-blue-800">{review.adminResponse}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {formatDate(review.createdAt!)}
                    </span>
                    {review.isMockData && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Sample Review
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!showAll && reviews.length > limit && (
            <div className="text-center">
              <button 
                onClick={() => setShowAll(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Reviews ({data?.total})
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}