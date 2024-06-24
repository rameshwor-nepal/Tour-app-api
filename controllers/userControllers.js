const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsyncError = require("../utils/catchAsyncError");
const factory = require("./../controllers/handlerFactory")


const filterObject = (obj, ...allowedfields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedfields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.getAllUsers = factory.getAll(User)

exports.getUser = factory.getOne(User)

//donot update passsword with this method
exports.updateUser = factory.updateOne(User)

exports.deleteUser = factory.deleteOne(User)

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsyncError(async (req, res, next) => {
    //create error id user post password data
    if (req.body.password || req.body.confirmPassword) {
        return next(new AppError("THis route is not for password updates, please use /update route", 401));
    }

    //update user document
    const filteredBody = filterObject(req.body, 'name', 'email');

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, runValidators: true
    });

    // await user.save()

    res.status(200).json({
        status: 'success',
        message: "User data are updated successfully",
        data: {
            user: updatedUser
        }
    })
});

exports.deleteMe = catchAsyncError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    })
})