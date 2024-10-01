import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

import { User } from '../models/user.model.js';
import { Address } from '../models/address.model.js';


const addOrUpdateAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized Request")
    }
    const { street, city, area, province } = req.body;

    if (
        [street, city, area, province].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All address fields are required")
    }

    let user = await User.findById(userId).populate('addressRef');

    if (user.addressRef) {
        // Update the existing address
        user.addressRef.street = street;
        user.addressRef.city = city;
        user.addressRef.area = area;
        user.addressRef.province = province;
        // user.addressRef.location = {
        //   type: 'Point',
        //   coordinates: coordinates
        // };

        await user.addressRef.save();
    } else {
        const newAddress = new Address({
            street, city, area, province,
            //   location: {
            //     type: 'Point',
            //     coordinates: coordinates
            //   }
        });

        const savedAddress = await newAddress.save();
        user.addressRef = savedAddress._id;
        await user.save();
    }

    return res.status(201).json(
        new ApiResponse(200, user, "Address updated Successfully")
    )
})

const deleteAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params; // Address ID from request parameters
    const userId = req.user._id; // Assuming the user is logged in

    // Validate if the address ID is a valid ObjectId
    if (!isValidObjectId(addressId)) {
        throw new ApiError(400, "Invalid address ID");
    }

    // Find the address in the database
    const address = await Address.findById(addressId);
    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    // Verify if the logged-in user has ownership of this address
    // Assuming the `User` model has a reference to the address under `addressRef`
    const user = await User.findById(userId);
    if (!user || user.addressRef.toString() !== addressId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this address");
    }

    // Delete the address
    await address.deleteOne();

    // Optionally, update the user to remove the reference to the deleted address
    user.addressRef = null;
    await user.save();

    return res.status(200).json(new ApiResponse(200, null, "Address deleted successfully"));
});

export {
    addOrUpdateAddress,
    deleteAddress,
}