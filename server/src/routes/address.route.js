import { Router } from 'express';

import {
    addOrUpdateAddress,
    deleteAddress,
} from '../controllers/address.controller.js';

import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.route('/user/update-address').post(verifyJWT, addOrUpdateAddress)
router.route('/:address-id/delete').delete(verifyJWT, deleteAddress)