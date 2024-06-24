const express = require("express");
const authController = require("./../controllers/authControllers");
const reviewControllers = require("./../controllers/reviewControllers")

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(authController.protect, reviewControllers.getAllReviews)
    .post(
        authController.protect,
        authController.restrictTo("user"),
        reviewControllers.setTourUserIds,
        reviewControllers.createReview
    )


router.route('/:id')
    .get(authController.protect, reviewControllers.getSingleReview)
    .delete(reviewControllers.deleteReview)
    .patch(reviewControllers.updateReview)

module.exports = router