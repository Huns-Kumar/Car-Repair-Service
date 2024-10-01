import { Router } from "express";

import {
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

} from '../controllers/shop.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';


const router = Router();

router.route('/createshop').post(verifyJWT, upload.single('shopImage'), createShop)
router.route('/:shop-id/deleteshop').delete(verifyJWT, deleteShop)
router.route('/:booking-id/accept-customer-request').post(verifyJWT, acceptCustomerRequest)
router.route('/:booking-id/cancel-customer-request').post(verifyJWT, cancelCustomerRequest)
router.route('/:shop-id/view-shop-details').get(verifyJWT, viewShopDetails)
router.route('/:shop-id/update-shop-info').patch(verifyJWT, updateShopInfo)
router.route('/:shop-id/update-shop-address').patch(verifyJWT, updateShopAddress)
router.route('/:shop-id/update-shop-image').post(verifyJWT, upload.single('shopImage'), updateShopImage)
router.route('/shop/completed-orders').get(verifyJWT, getCompletedOrders)
router.route('/shop/all-orders').get(verifyJWT, getCompletedAndCancelledOrders)
