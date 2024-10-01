import { Router } from "express";

import {
    createReview,
    getAllShopReviews,
    getOwnerShopReviews
} from '../controllers/review.controller.js'

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/create-review').post(verifyJWT, createReview)
router.route('/:shop-id/get-all-reviews').get(verifyJWT, getAllShopReviews)
router.route('/get-owner-shop-reviews').get(verifyJWT, getOwnerShopReviews)