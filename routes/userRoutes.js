const express = require("express");
const userController = require("./../controllers/userControllers")
const router = express.Router();
const authController = require('./../controllers/authControllers');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forget-password', authController.forgetPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.patch('/update-password', authController.protect, authController.updatePassword);
router.patch('/update-data', authController.protect, userController.updateMe);
router.delete('/delete-me', authController.protect, userController.deleteMe);
router.get('/me', authController.protect, userController.getMe, userController.getUser)

// router.use(authController.restrictTo("admin"))

router.route('/')
    .get(authController.protect, userController.getAllUsers)

router.route("/:id")
    .get(authController.protect, userController.getUser)
    .patch(authController.protect, userController.updateUser)
    .delete(authController.protect, userController.deleteUser);

module.exports = router;
