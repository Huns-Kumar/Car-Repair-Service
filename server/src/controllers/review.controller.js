import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

import { Review } from '../models/review.model.js';
import { Booking } from '../models/booking.model.js';
import { Shop } from '../models/shop.model.js';

const createReview = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { rating, comment } = req.body;
    const customerId = req.user._id;

    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating is required and should be between 1 and 5.");
    }

    // Find the booking and ensure it belongs to the customer and is completed
    const booking = await Booking.findOne({ _id: bookingId, customer: customerId, status: 'Completed' });
    if (!booking) {
        throw new ApiError(404, "Booking not found or not completed.");
    }

    // Check if the customer has already reviewed this booking
    const existingReview = await Review.findOne({ booking: bookingId, customer: customerId });
    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this booking.");
    }

    // Find the shop associated with the booking
    const shop = await Shop.findById(booking.shop);
    if (!shop) {
        throw new ApiError(404, "Shop not found.");
    }

    // Create a new review
    const newReview = new Review({
        booking: bookingId,
        shop: booking.shop,
        customer: customerId,
        rating,
        comment: comment || '',  // Optional comment
    });

    const savedReview = await newReview.save();

    // Update the shop's rating in real time
    const allReviews = await Review.find({ shop: shop._id });  // Fetch all reviews for this shop
    const totalReviews = allReviews.length;
    const totalRating = allReviews.reduce((acc, review) => acc + review.rating, 0);
    const newAverageRating = totalRating / totalReviews;

    // Update the shop's average rating
    shop.rating = newAverageRating;
    await shop.save();

    return res.status(201).json(new ApiResponse(201, savedReview, "Review created successfully and shop rating updated."));
});

const getAllShopReviews = asyncHandler(async (req, res) => {
    const { shopId } = req.params;

    // Check if shop ID is valid
    if (!isValidObjectId(shopId)) {
        throw new ApiError(400, "Invalid shop ID");
    }

    // Find the shop by ID
    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Fetch all reviews for the shop
    const reviews = await Review.find({ shop: shopId }).populate('customer', 'name'); // Populate customer name

    return res.status(200).json(new ApiResponse(200, reviews, "Shop reviews fetched successfully"));
});

const getOwnerShopReviews = asyncHandler(async (req, res) => {
    const ownerId = req.user._id;

    // Find the shop that belongs to the logged-in owner
    const shop = await Shop.findOne({ owner: ownerId });
    if (!shop) {
        throw new ApiError(404, "Shop not found or you do not own any shop.");
    }

    // Fetch all reviews for the shop owned by the logged-in user
    const reviews = await Review.find({ shop: shop._id }).populate('customer', 'name');

    return res.status(200).json(new ApiResponse(200, reviews, "Shop reviews fetched successfully"));
});

export {
    createReview,
    getAllShopReviews,
    getOwnerShopReviews
}
