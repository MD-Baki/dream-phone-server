const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ekbqwzw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

// JWT Middleware
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("unauthorized access");
    }
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
    });
}

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
    app.get("/bookingProduct", verifyJWT, async (req, res) => {
        const email = req.query.email;
        const decodedEmail = req.decoded.email;

        if (email !== decodedEmail) {
            return res.status(403).send({ message: "forbidden access" });
        }

        const query = { email: email };
        const bookings = await bookingProductCollection.find(query).toArray();
        res.send(bookings);
    });

    app.post("/bookingProduct", async (req, res) => {
        const booking = req.body;
        const result = await bookingProductCollection.insertOne(booking);
        res.send(result);
    });

    // JWT Token
    app.get("/jwt", async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        if (user) {
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
                expiresIn: "1d",
            });
            return res.send({ accessToken: token });
        }
        res.status(403).send({ accessToken: "" });
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
