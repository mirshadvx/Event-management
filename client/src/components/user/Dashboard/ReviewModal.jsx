import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogPortal,
    DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import api from "@/services/api";
import { toast } from "sonner";
import StarRating from "./StarRating";

const ReviewModal = ({ isOpen, onClose, event, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isOpen && event) {
            fetchExistingReview();
        }
    }, [isOpen, event]);

    const fetchExistingReview = async () => {
        try {
            const response = await api.get(`profile/${event.id}/review/`);
            if (response.data) {
                setExistingReview(response.data);
                setRating(response.data.rating);
                setComment(response.data.comment || "");
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error("Error fetching existing review:", error);
                toast.error(error.response?.data?.error || "Failed to fetch review");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please provide a rating");
            return;
        }

        setIsSubmitting(true);
        try {
            const reviewData = {
                rating,
                comment: comment.trim() || null,
            };

            let response;
            if (existingReview) {
                response = await api.put(`profile/${event.id}/review/`, reviewData);
                toast.success("Review updated successfully!");
            } else {
                response = await api.post(`profile/${event.id}/review/`, reviewData);
                toast.success("Review submitted successfully!");
            }

            setExistingReview(response.data);
            setIsEditing(false);
            onReviewSubmitted?.();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error(error.response?.data?.error || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isEditing) {
            setRating(existingReview?.rating || 0);
            setComment(existingReview?.comment || "");
        }
        setIsEditing(false);
        onClose();
    };

    const startEditing = () => {
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setRating(existingReview?.rating || 0);
        setComment(existingReview?.comment || "");
        setIsEditing(false);
    };

    const deleteReview = async () => {
        if (!existingReview) return;

        setIsSubmitting(true);
        try {
            await api.delete(`profile/${event.id}/review/`);
            toast.success("Review deleted successfully!");
            setExistingReview(null);
            setRating(0);
            setComment("");
            setIsEditing(false);
            onReviewSubmitted?.();
            onClose();
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error(error.response?.data?.error || "Failed to delete review");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogPortal>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                <DialogContent className="bg-gray-900 text-white border border-orange-500/20 shadow-lg shadow-orange-500/20 z-50 max-w-md mx-auto">
                    <DialogHeader>1
                        <DialogTitle className="flex items-center gap-2 text-orange-400">
                            <MessageSquare size={20} className="text-orange-400" />
                            {existingReview && !isEditing
                                ? "Your Review"
                                : existingReview && isEditing
                                ? "Edit Review"
                                : "Write a Review"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-300">
                            {event ? `Share your experience about " ${event.event_title} "` : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-orange-400">Rating</label>
                            <StarRating
                                rating={rating}
                                onRatingChange={setRating}
                                readonly={existingReview && !isEditing}
                                size={32}
                            />
                            {rating > 0 && (
                                <p className="text-sm text-gray-400 mt-1">
                                    {rating === 1
                                        ? "Poor"
                                        : rating === 2
                                        ? "Fair"
                                        : rating === 3
                                        ? "Good"
                                        : rating === 4
                                        ? "Very Good"
                                        : "Excellent"}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-orange-400">Comment (Optional)</label>
                            <Textarea
                                placeholder="Share your thoughts about the event..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[100px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
                                disabled={existingReview && !isEditing}
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
                        </div>

                        {existingReview && (
                            <div className="text-xs text-gray-500">
                                {isEditing ? "Originally reviewed" : "Reviewed"} on{" "}
                                {format(new Date(existingReview.created_at), "MMM dd, yyyy 'at' HH:mm")}
                            </div>
                        )}
                    </form>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {existingReview && !isEditing ? (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={startEditing}
                                    className="flex-1 sm:flex-initial bg-transparent border-orange-500 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                                >
                                    Edit Review
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={deleteReview}
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-initial bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                >
                                    Delete
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={isEditing ? cancelEditing : handleClose}
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-initial bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                                >
                                    {isEditing ? "Cancel" : "Close"}
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || rating === 0}
                                    className="flex-1 sm:flex-initial flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-400 shadow-lg shadow-orange-500/20"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                    {existingReview && isEditing ? "Update" : "Submit"} Review
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default ReviewModal;