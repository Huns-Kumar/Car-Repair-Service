import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose, { isValidObjectId } from 'mongoose';

import { Shop } from '../models/shop.model.js';
import { Booking } from '../models/booking.model.js';

const createShop = asyncHandler(async (req, res) => {
    const { shopName, shopAddress, servicesOffered, numberOfWorkers, operatingTime } = req.body;
    const ownerId = req.user._id; // Assuming the user is logged in and is a shop owner
    const shopImage = req.file ? req.file.path : null; // Assuming you're using multer for file upload

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Validate if any of the required fields are missing or invalid
    if (
        [shopName, shopAddress, servicesOffered, numberOfWorkers, operatingTime?.open, operatingTime?.close].some(
            (field) => field?.trim() === ''
        )
    ) {
        throw new ApiError(400, "All shop details are required and cannot be empty.");
    }

    // Check if the owner already has a shop
    const existingOwnerShop = await Shop.findOne({ owner: ownerId });
    if (existingOwnerShop) {
        throw new ApiError(400, "You already own a shop. You can only open one shop.");
    }

    // Check if a shop with the same name exists
    const existingShop = await Shop.findOne({ shopName });
    if (existingShop) {
        throw new ApiError(400, "Shop with this name already exists.");
    }

    // Create a new shop
    const newShop = new Shop({
        owner: ownerId,
        shopName,
        shopAddress,
        servicesOffered,
        numberOfWorkers,
        operatingTime,
        shopImage // Save the shop image if provided
    });

    // Save the new shop in the database
    const savedShop = await newShop.save();

    return res.status(201).json(new ApiResponse(201, savedShop, "Shop created successfully"));
});

const deleteShop = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const ownerId = req.user._id;

    if (!isValidObjectId(shopId)) {
        throw new ApiError(401, 'Invalid shop Id')
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    if (shop.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this shop");
    }

    await Shop.findByIdAndDelete(shopId);

    return res.status(200).json(new ApiResponse(200, null, "Shop deleted successfully"));
});

const acceptCustomerRequest = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const ownerId = req.user._id;

    if (!isValidObjectId(bookingId)) {
        throw new ApiError(401, 'Invalid booking id')
    }

    const booking = await Booking.findById(bookingId).populate('shop');
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const shop = await Shop.findById(booking.shop);
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    if (shop.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, "You are not authorized to accept this request");
    }

    if (booking.status !== 'Pending') {
        throw new ApiError(400, "Request cannot be accepted as it's not pending");
    }

    booking.status = 'Accepted';
    await booking.save();

    return res.status(200).json(new ApiResponse(200, booking, "Customer request accepted"));
});

const cancelCustomerRequest = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const shopOwnerId = req.user._id; // Assuming the user is logged in and is a shop owner

    if (!isValidObjectId(bookingId)) {
        throw new ApiError(400, "Invalid booking ID");
    }

    const booking = await Booking.findById(bookingId).populate('shop');

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // Check if the logged-in user is the owner of the shop for this booking
    if (booking.shop.owner.toString() !== shopOwnerId.toString()) {
        throw new ApiError(403, "You are not authorized to cancel this booking");
    }

    // Check if the booking has already been accepted
    if (booking.status === "Accepted") {
        throw new ApiError(400, "Cannot cancel an accepted booking");
    }

    // Calculate the time difference between the booking creation and the current time
    const timeDifference = Date.now() - new Date(booking.createdAt).getTime();
    const timeLimit = 2 * 60 * 1000; // 2 minutes in milliseconds

    // If 2 minutes have passed, the booking will be canceled automatically
    if (timeDifference > timeLimit) {
        booking.status = "Cancelled";
        await booking.save();
        return res.status(200).json(new ApiResponse(200, booking, "Booking has been automatically cancelled due to no response"));
    }

    // Manual cancellation by shop owner within 2 minutes
    booking.status = "Cancelled";
    await booking.save();

    return res.status(200).json(new ApiResponse(200, booking, "Booking cancelled successfully by shop owner"));
});

const viewShopDetails = asyncHandler(async (req, res) => {
    const { shopId } = req.params;

    if (!isValidObjectId(shopId)) {
        throw new ApiError(401, 'Invalid shop id')
    }

    const shop = await Shop.findById(shopId).populate('shopAddress');
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    return res.status(200).json(new ApiResponse(200, shop, "Shop details retrieved successfully"));
});

const updateShopInfo = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const { shopName, servicesOffered, numberOfWorkers, operatingTime } = req.body;
    const ownerId = req.user._id;

    if (!isValidObjectId(shopId)) {
        throw new ApiError(401, "Invalid shop id")
    }
    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Verify if the logged-in user is the owner of the shop
    if (shop.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, "You are not authorized to update this shop");
    }

    // Validate if any field contains an empty string
    if (
        [shopName, servicesOffered, numberOfWorkers, operatingTime?.open, operatingTime?.close].some(
            (field) => field?.trim() === ''
        )
    ) {
        throw new ApiError(400, "Fields cannot contain empty values");
    }

    // Update shop details
    shop.shopName = shopName || shop.shopName;
    shop.servicesOffered = servicesOffered || shop.servicesOffered;
    shop.numberOfWorkers = numberOfWorkers || shop.numberOfWorkers;
    shop.operatingTime = operatingTime || shop.operatingTime;

    const updatedShop = await shop.save();

    return res.status(200).json(new ApiResponse(200, updatedShop, "Shop updated successfully"));
});

const updateShopAddress = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const { street, city, area, province } = req.body;
    const ownerId = req.user._id;

    if (!isValidObjectId(shopId)) {
        throw new ApiError(401, "Invalid shop id");
    }

    // Find shop by id
    const shop = await Shop.findById(shopId).populate('shopAddress');
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Verify if the logged-in user is the owner of the shop
    if (shop.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, "You are not authorized to update this shop address");
    }
    if (
        [street, city, area, province,].some(
            (field) => field?.trim() === ''
        )
    ) {
        throw new ApiError(400, "Fields cannot contain empty values");
    }

    // Update shop address
    if (shop.shopAddress) {
        shop.shopAddress.street = street || shop.shopAddress.street;
        shop.shopAddress.city = city || shop.shopAddress.city;
        shop.shopAddress.area = area || shop.shopAddress.area;
        shop.shopAddress.province = province || shop.shopAddress.province;

        await shop.shopAddress.save();
    } else {
        throw new ApiError(404, "Shop address not found");
    }

    return res.status(200).json(new ApiResponse(200, shop.shopAddress, "Shop address updated successfully"));
});

const updateShopImage = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const ownerId = req.user._id;  // Assuming the user is logged in and is a shop owner

    // Check if a shop ID is valid
    if (!isValidObjectId(shopId)) {
        throw new ApiError(400, "Invalid shop ID");
    }

    // Check if a shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw new ApiError(404, "Shop not found");
    }

    // Verify if the logged-in user is the owner of the shop
    if (shop.owner.toString() !== ownerId.toString()) {
        throw new ApiError(403, "You are not authorized to update this shop");
    }

    // Check if the shop image file is provided
    if (!req.file) {
        throw new ApiError(400, "Shop image is required");
    }

    // Assuming you're using multer for file upload, get the new image path
    const shopImage = req.file.path;

    // Update the shop image
    shop.shopImage = shopImage;

    // Save the updated shop
    const updatedShop = await shop.save();

    return res.status(200).json(new ApiResponse(200, updatedShop, "Shop image updated successfully"));
});

const getCompletedOrders = asyncHandler(async (req, res) => {
    const ownerId = req.user._id;  // Assuming the user is logged in and is a shop owner

    // Find the shop associated with the logged-in owner
    const shop = await Shop.findOne({ owner: ownerId });
    if (!shop) {
        throw new ApiError(404, "Shop not found for this owner");
    }

    // Fetch all completed orders for the shop
    const completedOrders = await Booking.find({ shop: shop._id, status: 'Completed' }).populate('customer');

    if (!completedOrders) {
        throw new ApiError(500, "Internal server error!");
    }

    return res.status(200).json(new ApiResponse(200, completedOrders, "Completed orders fetched successfully"));
});

const getCompletedAndCancelledOrders = asyncHandler(async (req, res) => {
    const ownerId = req.user._id;  // Assuming the user is logged in and is a shop owner

    // Find the shop associated with the logged-in owner
    const shop = await Shop.findOne({ owner: ownerId });
    if (!shop) {
        throw new ApiError(404, "Shop not found for this owner");
    }

    // Fetch all completed and cancelled orders for the shop
    const orders = await Booking.find({
        shop: shop._id,
        status: { $in: ['Completed', 'Cancelled'] }
    }).populate('customer');

    if (!orders) {
        throw new ApiError(500, "Internal server error!");
    }

    return res.status(200).json(new ApiResponse(200, orders, "Completed and cancelled orders fetched successfully"));
});



export {
    createShop,
    deleteShop,
    acceptCustomerRequest,
    cancelCustomerRequest,
    viewShopDetails,
    updateShopInfo,
    updateShopAddress,
    updateShopImage,
    getCompletedOrders,
    getCompletedAndCancelledOrders,
}


