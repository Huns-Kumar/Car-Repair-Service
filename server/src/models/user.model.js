import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, },
    email: { type: String, required: true, unique: true, lowercase: true, },
    username: { type: String, required: true, unique: true,  lowercase: true, trim: true, index: true, },
    password: { type: String, required: true },
    phone: {
        type: Number,
        validate: {
            validator: function (v) {
                return /^(\+92|03)[0-9]{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number! Only Pakistani numbers are allowed.`
        },
        required: true
    },
    image: {
        type: String
    },
    paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    addressRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    role: { type: String, enum: ['customer', 'shopOwner'], default: 'customer' }, // Default role as customer
    refreshToken: {
        type: String,
    },
}, {timestamps: true});

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        name: this.name,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)