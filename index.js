const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
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

    const saveProductCollection = client
        .db("dreamPhoneDB")
        .collection("saveProduct");

    const usersCollection = client.db("dreamPhoneDB").collection("users");

    const paymentsCollection = client.db("dreamPhoneDB").collection("payments");

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

    app.get("/category/:id", async (req, res) => {
        const options = await allProductsCollection
            .find({ brand: ObjectId(req.params.id) })
            .toArray();
        res.send(options);
    });

    app.post("/allProducts", async (req, res) => {
        const product = req.body;
        const { brand, ...rest } = product;
        const data = {
            brand: ObjectId(brand),
            ...rest,
        };
        const result = await allProductsCollection.insertOne(data);
        res.send(result);
    });

    app.put("/allProducts/:id", verifyJWT, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                ads: "advertisement",
            },
        };
        const result = await allProductsCollection.updateOne(
            filter,
            updateDoc,
            options
        );
        res.send(result);
    });

    app.delete("/allProducts/:id", verifyJWT, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await allProductsCollection.deleteOne(filter);
        res.send(result);
    });

    // Save Product
    app.get("/saveProduct", verifyJWT, async (req, res) => {
        const email = req.query.email;
        const decodedEmail = req.decoded.email;

        if (email !== decodedEmail) {
            return res.status(403).send({ message: "forbidden access" });
        }

        const query = { email: email };
        const bookings = await saveProductCollection.find(query).toArray();
        res.send(bookings);
    });

    app.post("/saveProduct", async (req, res) => {
        const save = req.body;
        const result = await saveProductCollection.insertOne(save);
        res.send(result);
    });

    app.delete("/saveProduct/:id", async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await saveProductCollection.deleteOne(filter);
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

    app.get("/bookingProduct/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const booking = await bookingProductCollection.findOne(query);
        res.send(booking);
    });

    app.post("/bookingProduct", async (req, res) => {
        const booking = req.body;
        const result = await bookingProductCollection.insertOne(booking);
        res.send(result);
    });

    app.delete("/bookingsProduct/:id", verifyJWT, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await bookingProductCollection.deleteOne(filter);
        res.send(result);
    });

    // Payment
    app.post("/create-payment-intent", async (req, res) => {
        const booking = req.body.items;

        const amount = parseInt(booking.price);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ["card"],
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    });

    app.post("/payments", async (req, res) => {
        const payment = req.body;
        const result = await paymentsCollection.insertOne(payment);
        const id = payment.bookingId;
        const filter = { _id: ObjectId(id) };
        const updatedDoc = {
            $set: {
                paid: true,
                transactionId: payment.transactionId,
            },
        };
        const updatedResult = await bookingProductCollection.updateOne(
            filter,
            updatedDoc
        );
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
    app.get("/users", async (req, res) => {
        const query = {};
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    });
    app.get("/seller", async (req, res) => {
        const query = { role: "Seller" };
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    });

    app.put("/seller/:id", verifyJWT, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                verify: "verified",
            },
        };
        const result = await usersCollection.updateOne(
            filter,
            updateDoc,
            options
        );
        res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.send({ isAdmin: user?.role === "admin" });
    });

    app.get("/users/seller/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await usersCollection.findOne(query);
        res.send({ isSeller: user?.role === "Seller" });
    });

    app.post("/users", async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
    });

    app.delete("/users/:id", verifyJWT, async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await usersCollection.deleteOne(filter);
        res.send(result);
    });
}
run().catch((err) => console.error(err));

app.get("/", async (req, res) => {
    res.send("Dream Phone Server is Running");
});

app.listen(port, () => console.log(`Dream Phone running on ${port}`));
