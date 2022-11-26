const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ekbqwzw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    const productsCategoriesCollection = client
        .db("dreamPhoneDB")
        .collection("productsCategories");

    const allProductsCollection = client
        .db("dreamPhoneDB")
        .collection("allProducts");

    const bookingProductCollection = client
        .db("dreamPhoneDB")
        .collection("bookingProduct");

    const usersCollection = client.db("dreamPhoneDB").collection("users");

    // Product Categories
    app.get("/productsCategories", async (req, res) => {
        const query = {};
        const options = await productsCategoriesCollection
            .find(query)
            .toArray();
        res.send(options);
    });

    // All Products
    app.get("/allProducts", async (req, res) => {
        const query = {};
        const options = await allProductsCollection.find(query).toArray();
        res.send(options);
    });

    app.post("/allProducts", async (req, res) => {
        const product = req.body;
        const result = await allProductsCollection.insertOne(product);
        res.send(result);
    });

    // Booking Product
    app.get("/bookingProduct", async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const bookings = await bookingProductCollection.find(query).toArray();
        res.send(bookings);
    });

    app.post("/bookingProduct", async (req, res) => {
        const booking = req.body;
        const result = await bookingProductCollection.insertOne(booking);
        res.send(result);
    });

    // All Users'
    app.post("/users", async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
    });
}
run().catch((err) => console.error(err));

app.get("/", async (req, res) => {
    res.send("Dream Phone Server is Running");
});

app.listen(port, () => console.log(`Dream Phone running on ${port}`));
