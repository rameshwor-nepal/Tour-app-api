const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');

const Tour = require('./../models/tourModel')
const Review = require("./../models/reviewModel")
const User = require("./../models/userModel")

dotenv.config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
}).then(() => console.log("Db connection successful"));


// read jsson file for data to databse
const tours = JSON.parse(fs.readFileSync(`${__dirname}/data/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/data/reviews.json`, 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log("data loaded!")
    }
    catch (err) {
        console.log(err)
    }
    process.exit();
};

//delete data if present
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("data deleted!")
    }
    catch (err) {
        console.log(err)
    }
    process.exit();
};

if (process.argv[2] === '--import') {
    importData();
}
else if (process.argv[2] === '--delete') {
    deleteData();
}
