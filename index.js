const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qapqu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
        if (err) {
            console.log(err);
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();

        const toolsCollection = client.db('laptop-parts-village').collection('tools');
        const reviewsCollection = client.db('laptop-parts-village').collection('reviews');
        const purchaseCollection = client.db('laptop-parts-village').collection('purchase');
        const summaryCollection = client.db('laptop-parts-village').collection('summary');
        const usersCollection = client.db('laptop-parts-village').collection('users');
        const userInfoCollection = client.db('laptop-parts-village').collection('userInfo');

        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.get('/summary', async (req, res) => {
            const query = {};
            const cursor = summaryCollection.find(query);
            const summary = await cursor.toArray();
            res.send(summary);
        })

        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolsCollection.findOne(query);
            res.send(tool);
        });

        app.get('/purchase', verifyJWT, async (req, res) => {
            const userEmail = req.query.userEmail;
            const decodedEmail = req.decoded.email;
            if (userEmail === decodedEmail) {
                const query = { userEmail: userEmail };
                const purchased = await purchaseCollection.find(query).toArray();
                return res.send(purchased);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }

        })


        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase);
            res.send(result);
        })


        app.patch('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const availableQuantity = req.body.availableQuantity;
            const newQuantity = req.body.newQuantity;

            const updateQuantity = availableQuantity - newQuantity;
            const query = { _id: ObjectId(id) };
            const tools = await toolsCollection.findOneAndUpdate(query,
                { $set: { "availableQuantity": updateQuantity } });
            res.send(tools);
            console.log(tools);
        })

        app.get('/user', verifyJWT, async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await usersCollection.updateOne(filter, updateDoc);

                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }

        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_SECRET_TOKEN, {
                expiresIn: '7d'
            });
            res.send({ result, token });
        })


        app.post('/tools', async (req, res) => {
            const newItem = req.body;
            const result = await toolsCollection.insertOne(newItem);
            res.send(result);
        });

        app.delete('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolsCollection.deleteOne(query);
            res.send(result);
        });

        app.put('/userInfo/:email', async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: userInfo,
            };
            const result = await userInfoCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        app.get('/userInfo/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userInfoCollection.findOne({ email: email });
            res.send(user);
        })

        app.post('/reviews', async (req, res) => {
            const newItem = req.body;
            const result = await reviewsCollection.insertOne(newItem);
            res.send(result);
        });



    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from Laptop Parts!')
})

app.listen(port, () => {
    console.log(`Laptop parts app listening on port ${port}`)
})