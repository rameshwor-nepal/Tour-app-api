const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
    },
    image: {
        type: String,
        // required: [true, "Please enter your name"]
    },
    role: {
        type: String,
        enum: ["user", "guide", "lead-guide", "admin"],
        default: "user",
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minLength: 5,
        select: false,
    },
    confirmPassword: {
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: "Passwords do not match"
        }
    },
    passwordChangesAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    this.confirmPassword = undefined;
    next();
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangesAt = Date.now(); - 1000;
    next();
})

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changePasswordAfter = async function (timeStamp) {
    if (this.passwordChangesAt) {
        const changesTimeStamp = parseInt(this.passwordChangesAt.getTime() / 1000, 10);

        return timeStamp < changesTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordToken = function () {
    const resetToken = crypto.randomBytes(16).toString('hex');
    this.passwordResetToken = crypto.createHash('sha-256').update(resetToken).digest('hex');

    // console.log({ resetToken }, this.passwordResetToken)

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken
}

const User = mongoose.model("User", userSchema);

module.exports = User;

