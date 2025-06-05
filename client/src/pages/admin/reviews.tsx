import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Eye, EyeOff, Trash2, MessageSquare, User, Plus } from "lucide-react";
import { CustomerReview } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminReviews() {
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<CustomerReview | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newReview, setNewReview] = useState({
    customerName: "",
    title: "",
    comment: "",
    rating: 5,
    isVisible: true,
    isVerified: false,
    isMockData: false
  });

  const { data, isLoading } = useQuery<{ reviews: CustomerReview[]; total: number }>({
    queryKey: ['/api/reviews', { limit: 50, offset: 0 }],
    retry: false,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: string; isVisible: boolean }) => {
      await apiRequest(`/api/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isVisible }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Success",
        description: "Review visibility updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update review visibility",
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/reviews/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    },
  });

  const addResponseMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      await apiRequest(`/api/reviews/${id}/response`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      setSelectedReview(null);
      setAdminResponse("");
      toast({
        title: "Success",
        description: "Admin response added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add admin response",
        variant: "destructive",
      });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: typeof newReview) => {
      await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      setNewReview({
        customerName: "",
        title: "",
        comment: "",
        rating: 5,
        isVisible: true,
        isVerified: false,
        isMockData: false
      });
      toast({
        title: "Success",
        description: "Review created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create review",
        variant: "destructive",
      });
    },
  });

  const removeMockReviewsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/reviews/mock', {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Success",
        description: "Mock reviews removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove mock reviews",
        variant: "destructive",
      });
    },
  });

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Customer Reviews</h1>
        </div>
        <div className="grid gap-4">
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customer Reviews ({data?.total || 0})</h1>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Customer Name"
                  value={newReview.customerName}
                  onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                />
                <Input
                  placeholder="Review Title"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                />
                <Textarea
                  placeholder="Review Comment"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <label>Rating:</label>
                  <select
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    className="border rounded px-2 py-1"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newReview.isVisible}
                      onChange={(e) => setNewReview({ ...newReview, isVisible: e.target.checked })}
                    />
                    Visible
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newReview.isVerified}
                      onChange={(e) => setNewReview({ ...newReview, isVerified: e.target.checked })}
                    />
                    Verified
                  </label>
                </div>
                <Button
                  onClick={() => createReviewMutation.mutate(newReview)}
                  disabled={createReviewMutation.isPending || !newReview.customerName || !newReview.comment}
                  className="w-full"
                >
                  Create Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => removeMockReviewsMutation.mutate()}
            disabled={removeMockReviewsMutation.isPending}
          >
            Remove Mock Reviews
          </Button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600 mb-4">Customer reviews will appear here once they start submitting them.</p>
            <Button onClick={() => createReviewMutation.mutate({ ...newReview, isMockData: true })}>
              Add Sample Review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className={review.isMockData ? "border-orange-200 bg-orange-50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{review.customerName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt!)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.isVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Verified
                      </Badge>
                    )}
                    {review.isMockData && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Sample
                      </Badge>
                    )}
                    <Badge variant={review.isVisible ? "default" : "secondary"}>
                      {review.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">{review.title}</h4>
                <p className="text-gray-700 mb-4">{review.comment}</p>

                {review.adminResponse && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                    <p className="text-sm text-blue-800">{review.adminResponse}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleVisibilityMutation.mutate({
                      id: review.id,
                      isVisible: !review.isVisible
                    })}
                    disabled={toggleVisibilityMutation.isPending}
                  >
                    {review.isVisible ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Show
                      </>
                    )}
                  </Button>

                  {!review.adminResponse && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedReview(review)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Respond to Review</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-medium">{review.title}</p>
                            <p className="text-sm text-gray-600">{review.comment}</p>
                          </div>
                          <Textarea
                            placeholder="Write your response..."
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                          />
                          <Button
                            onClick={() => addResponseMutation.mutate({
                              id: review.id,
                              response: adminResponse
                            })}
                            disabled={addResponseMutation.isPending || !adminResponse.trim()}
                          >
                            Add Response
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteReviewMutation.mutate(review.id)}
                    disabled={deleteReviewMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}