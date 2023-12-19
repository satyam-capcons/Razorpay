const express = require('express');
const cors = require('cors');
const razorpayRoutes = require('./routes/index')
const connectToMongoDB = require('./connectors/mongoDb');
const app = express();
app.use(express.static(__dirname));

// Set up a route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(cors());
app.use('/api', razorpayRoutes);

const PORT = process.env.PORT || 5000;

const MONGODB = "mongodb+srv://satyam:3Fnqpee7tzr0Xn2r@cluster0.d9a4epx.mongodb.net/?retryWrites=true&w=majority";

connectToMongoDB(MONGODB)
    .then(() => {
        return app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .then((res) => {
        console.log(`Server running at ${res.url}`);
    })
    .catch((err) => {
        console.error(err);
        console.log('error');
    });