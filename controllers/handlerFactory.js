const catchAsync = require("./../utils/catchAsyncError")
const AppError = require("./../utils/appError")
const APIFeatures = require('./../utils/apiFeatures')

exports.deleteOne = (Model) => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
        return next(new AppError("No document found with this ID! ", 404))
    }

    res.status(204).json({
        status: "success",
        data: null
    });

});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError("No document found with this ID! ", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            data: doc
        }
    });

});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            data: newDoc
        }
    });

});

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    // const id = req.params.id * 1;
    let query = Model.findById(req.params?.id);

    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;


    if (!doc) {
        return next(new AppError("No document found with this ID! ", 404))
    }
    res.status(200).json({
        status: "success",
        data: {
            data: doc
        }
    });

});

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    //to allow get nested review on tour
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //execute query
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    // const docs = await features.query.explain();
    const docs = await features.query;
    //response of api
    res.status(200).json({
        status: "success",
        results: docs.length,
        data: {
            data: docs
        }
    });
});
