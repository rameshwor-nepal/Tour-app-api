const dotenv = require('dotenv');
const app = require("./app")
const mongoose = require('mongoose')

dotenv.config({ path: './config.env' });
// console.log(process.env)

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
})
    .then(() => console.log("Db connection successful"));


const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}....`);
});

process.on('uncaughtException', err => {
    console.log("Uncaught exception! Shutting down");
    console.log(err.name, err.message)
    server.close(() => {
        process.exit(1);
    })
})
