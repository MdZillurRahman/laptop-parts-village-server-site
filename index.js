const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qapqu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const toolsCollection = client.db('laptop-parts-village').collection('tools');
        const reviewsCollection = client.db('laptop-parts-village').collection('reviews');
        const purchaseCollection = client.db('laptop-parts-village').collection('purchase');
        const summaryCollection = client.db('laptop-parts-village').collection('summary');

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

        app.get('/purchase', async (req, res) => {
            const userEmail = req.query.userEmail;
            console.log(userEmail);
            const query = {userEmail: userEmail};
            const purchased = await purchaseCollection.find(query).toArray();
            res.send(purchased);
            // console.log(purchased);
        })


        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase);
            res.send(result);
        })


        app.patch('/tools/:id', async (req, res) => {
            const id  = req.params.id;  
            const availableQuantity = req.body.availableQuantity;
            const newQuantity = req.body.newQuantity;          
            
            const updateQuantity = availableQuantity - newQuantity;
            const query = { _id: ObjectId(id) };
            const tools = await toolsCollection.findOneAndUpdate(query,
                { $set: { "availableQuantity": updateQuantity } });
            res.send(tools);
            console.log(tools);
        })

        

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