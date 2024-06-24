const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require("../models/userModel");
const catchAsync = require('./../utils/catchAsyncError');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') cookieOption.secure = true;
    res.cookie('jwt', token, cookieOption);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        },
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        role: req.body.role,
    });

    createSendToken(newUser, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // check if email and password exists
    if (!email || !password) {
        return next(new AppError("Please, provide email and password", 400));
    }

    //check if user exists with given email and password
    const user = await User.findOne({ email }).select('+password');
    // const correct = await user.correctPassword(password, user.password)

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("incorrect email or password", 401))
    }

    //if everything is ok, send token to client
    createSendToken(user, 200, res);


});

exports.protect = catchAsync(async (req, res, next) => {
    //get token and check for it
    let token = ''
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError("You are not logged in", 401))
    }

    //validate a token 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    //check if user exists
    const loggedUser = await User.findById(decoded.id);

    if (!loggedUser) {
        return next(new AppError("The user belonging to this token do not exists", 401));
    }

    //check if user changed password after the token was issued
    // if (loggedUser.changePasswordAfter(decoded.iat)) {
    //     return next(new AppError("user recently changed password! Please log in again", 401));
    // }

    //grant access
    req.user = loggedUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // role ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You do not have this permission to perform this action", 403));
        }
        next();
    }
};

exports.forgetPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new AppError("There is no user with this email address", 404))
    }

    const resetToken = user.createPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
    const message = `Forget your password ? submit a Parch request with your new password and 
    password confirm to: ${resetURL}. If you didn't forget password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token lst for 10 min only',
            message
        });

        res.status(200).json({
            status: 'success',
            messsage: 'Token sent to mail'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later'), 500)

    }

};

exports.resetPassword = catchAsync(async (req, res, next) => {
    // get user based on token
    const hashedToken = crypto
        .createHash('sha-256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // if token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError("token is invalid or expired", 401))
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    //update changePasswordAt property of user


    //log user in and sent jwt
    createSendToken(user, 200, res);

});


exports.updatePassword = catchAsync(async (req, res, next) => {
    //get user from the collection
    const user = await User.findById(req.user.id).select('password');

    //check whether the entered password is correct
    if (!await (user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError("your current password is wrong", 401))
    }

    //update password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    //log user in and sent jwt
    createSendToken(user, 200, res);

});