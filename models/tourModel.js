const mongoose = require('mongoose')
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "A tour should have a name"],
            trim: true,
            maxlength: [40, 'A tour must have less or equal to 40 characters'],
            minlength: [8, 'A tour must have more than or equal to 8 characters']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, "A tour must have duration"]
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have group size"]
        },
        difficulty: {
            type: String,
            required: [true, "A tour must have difficulty"],
            enum: {
                values: ["easy", "medium", "difficult"],
                message: "Difficulty is either: easy, medium or difficult"
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            set: val => Math.round(val * 10) / 10
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: true
        },
        priceDiscount: {
            type: Number,
            validate:
            //donot work with update, only work with current document on NEW document creation
            {
                validator: function (value) {
                    return value < this.price
                },
                message: 'Discount price {{VALUE}} should be less than regular price'
            }

        },
        summary: {
            type: String,
            trim: true,
            required: [true, "A tour must have description"]
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, "A tour must have cover image"]
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now()
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
        ],
        // reviews: [
        //     {
        //         type: mongoose.Schema.ObjectId,
        //         ref: 'Review'
        //     }
        // ]
    },

    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
})

//virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

//indexes
tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' })

//Document Middleware: runs before .save() and .create() not for .insertmany()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
})

// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })

// tourSchema.post('save', function(doc, next){
//     next();
// })

//Query Middleware
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    next();
})

// tourSchema.post(/^find/, function (docs,next) {
//     next();
// })

//Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({
//         $match: { secretTour: { $ne: true } }
//     })
//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;