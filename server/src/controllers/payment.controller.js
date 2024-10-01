import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

import { Payment } from '../models/payment.model.js';
import { User } from '../models/user.model.js';



const addOrUpdatePayment = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming req.user is populated with the user's data

    if (!userId) {
        throw new ApiError(401, "Unauthorized Request");
    }

    const { paymentMethod, cardNumber, expiryDate, cardHolderName } = req.body; // Payment details from request body

    if (paymentMethod.toString() !== 'cash') {
        if (
            [paymentMethod, cardNumber, expiryDate, cardHolderName].some((field) => !field || field.toString().trim() === "")
        ) {
            throw new ApiError(400, "All payment fields are required");
        }
    }

    let user = await User.findById(userId).populate('paymentRef'); // Populate the paymentRef to access linked Payment document

    if (paymentMethod.toString() !== 'cash') {
        if (user.paymentRef) {
            // Update the existing payment
            user.paymentRef.paymentMethod = paymentMethod;
            user.paymentRef.cardNumber = cardNumber;
            user.paymentRef.expiryDate = expiryDate;
            user.paymentRef.cardHolderName = cardHolderName;

            await user.paymentRef.save(); // Save the updated payment details
        } else {
            // Create a new payment if it does not exist
            let newPayment;
            if (paymentMethod.toString() !== 'cash') {
                newPayment = new Payment({
                    paymentMethod, cardNumber, expiryDate, cardHolderName,
                });
            }

            const savedPayment = await newPayment.save(); // Save the new payment
            user.paymentRef = savedPayment._id; // Link the new payment reference to the user
            await user.save(); // Save the user with the updated payment reference
        }
    }

    return res.status(201).json(
        new ApiResponse(200, user, "Payment updated successfully")
    );
});

const deletePayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;  // Payment ID from request parameters
    const userId = req.user._id;  // Assuming the user is logged in

    // Validate if the payment ID is a valid ObjectId
    if (!isValidObjectId(paymentId)) {
        throw new ApiError(400, "Invalid payment ID");
    }

    // Find the payment in the database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
        throw new ApiError(404, "Payment method not found");
    }

    // Verify if the logged-in user has ownership of this payment
    // Assuming the `User` model has a reference to the payment under `paymentRef`
    const user = await User.findById(userId);
    if (!user || user.paymentRef.toString() !== paymentId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this payment method");
    }

    // Delete the payment method
    await payment.deleteOne();

    // Optionally, update the user to remove the reference to the deleted payment
    user.paymentRef = null;
    await user.save();

    return res.status(200).json(new ApiResponse(200, null, "Payment method deleted successfully"));
});

export {
    addOrUpdatePayment,
    deletePayment,
}

