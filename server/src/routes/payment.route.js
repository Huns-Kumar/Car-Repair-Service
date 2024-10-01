import { Router } from "express";

import {
    addOrUpdatePayment,
    deletePayment
} from '../controllers/payment.controller.js'

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/update-payment').post(verifyJWT, addOrUpdatePayment)
router.route('/:payment-id/delete-payment').delete(verifyJWT, deletePayment)
