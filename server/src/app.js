import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

//common middlewares
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit :"16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from './routes/user.route.js';
import bookingRouter from './routes/booking.route.js';
import addressRouter from './routes/address.route.js';
import shopRouter from './routes/shop.route.js';
import reviewRouter from './routes/review.route.js';

app.use('/api/v1/users', userRouter)
app.use('/api/v1/booking', bookingRouter)
app.use('/api/v1/address', addressRouter)
app.use('/api/v1/shop', shopRouter)
app.use('/api/v1/review', reviewRouter)

export {app}
