import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose, {isValidObjectId} from 'mongoose';

import { Booking } from '../models/booking.model.js';
import { User } from '../models/user.model.js';
import { Shop } from '../models/shop.model.js';

const bookService = asyncHandler(async (req, res) => {
    const { service, appointmentDate, notes } = req.body;
    const { shopId } = req.params;
    const customerId = req.user._id;

    if (!customerId) {
        throw new ApiError(401, "Unauthorized request");
    }
    if(!isValidObjectId(shopId)){
        throw new ApiError(402, "Select the shop to get Service")
    }
    if([
        service, appointmentDate,
    ].some((field) => field?.trim() === '')){
        throw new ApiError(401, "All fields are required")
    }

    const currentDate = new Date();
    const selectedAppointmentDate = new Date(appointmentDate);

    if (selectedAppointmentDate <= currentDate) {
        throw new ApiError(400, "Appointment date must be a future date.");
    }

    const customer = await User.findById(customerId);
    const shop = await Shop.findById(shopId);
    const customerAddress = customer.addressRef
    const customerPayment = customer.paymentRef
    const shopAddress = shop.shopAddress

    if (!customer || !shop || !customerAddress || !shopAddress || !customerPayment) {
        throw new ApiError(400, "Invalid customer or shop information");
    }

    const newBooking = new Booking({
        customer: customerId,
        service,
        shop: shopId,
        status: 'Pending',
        customerAddress: customerAddress._id,
        shopAddress: shopAddress._id,
        payment: customerPayment._id,
        appointmentDate: selectedAppointmentDate,
        notes: notes? notes : null
    });

    const savedBooking = await newBooking.save();

    return res.status(201).json(new ApiResponse(201, savedBooking, "Service booked successfully"));
});

// Cancel Service Controller (only within 5 minutes)
const cancelService = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const customerId = req.user._id;

    if (!customerId) {
        throw new ApiError(401, "Unauthorized request");
    }
    if(!isValidObjectId(bookingId)){
        throw new ApiError(401, "Unauthorized request, bookingId is invalid")
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    if (booking.customer.toString() !== customerId.toString()) {
        throw new ApiError(403, "You can only cancel your own bookings");
    }

    const timeElapsed = (Date.now() - booking.createdAt.getTime()) / 60000; // Time in minutes
    if (timeElapsed > 5) {
        throw new ApiError(400, "You can only cancel within 5 minutes of booking");
    }

    booking.status = 'Cancelled';
    await booking.save();

    return res.status(200).json(new ApiResponse(200, booking, "Booking canceled successfully"));
});

// View Booking History (for customers)
const viewBookingHistory = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    if(!customerId){
        throw new ApiError(401, "Unauthorized Request")
    }

    const bookings = await Booking.find({ customer: customerId }).populate('shop').populate('customerAddress').populate('shopAddress');

    return res.status(200).json(new ApiResponse(200, bookings, "Booking history retrieved successfully"));
});

export {
    bookService,
    cancelService,
    viewBookingHistory
}