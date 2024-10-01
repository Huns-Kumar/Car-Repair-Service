import { Router } from "express";

import {
    bookService,
    cancelService,
    viewBookingHistory
} from '../controllers/booking.controller.js'

import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/:shop-id/bookservice').post(verifyJWT, bookService)
router.route('/:booking-id/cancelservice').delete(verifyJWT, cancelService)
router.route('/user/bookinghistory').get(verifyJWT, viewBookingHistory)