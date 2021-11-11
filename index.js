const express = require('express');
var cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;

const app = express();

// Use middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0f9z2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const db_name="nich_website"
        const db = client.db(db_name);
        const productCollection = db.collection('product')
        const orderCollection = db.collection('order_collection')

        // // Get api (Get All Products)
        app.get('/products',async(req, res)=> {
            const cursor = productCollection.find({});
            const places = await cursor.toArray();
            res.send(places);  
        });

        // Get All Orders 
        app.get('/orders', async (req, res) => {
            let query = {};
            const email = req.query.email;
            if (email) {
                query={email:email}
            }
            const cursor = orderCollection.find(query);
            const places = await cursor.toArray();
            res.send(places);  
        });


        // Post api (Add Products)
        app.post("/addproduct", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.json(result);
        });


        // Place An Order 
        app.post("/order", async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            const result = await orderCollection.insertOne(order);
            res.json(result);
        });

        // Conditional  find Api (Find Products By id)
        app.get("/placeorder/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.json(product);
        });

        // app.get("/myorder/:email", async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email: email };
        //     const courser = orderCollection.find(query);
        //     const orders = await courser.toArray();
        //     res.send(orders);
        // });


        // app.get("/manageorder", async (req, res) => {
        //     const courser = orderCollection.find({});
        //     const orders = await courser.toArray();
        //     res.send(orders);
        // });
        // app.post("/order", async (req, res) => {
        //     const order = req.body;
        //     const result = await orderCollection.insertOne(order)
        //     res.send(result);
        // });

        // app.delete("/order/:id", async (req, res) => {
        //     const id = req.params.id;
        //     console.log(id);
        //     const query = { _id: ObjectId(id) };
        //     const result = await orderCollection.deleteOne(query);
        //     res.json(result);
        // });

        // app.put("/order/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) };
        //     const options = {
        //         upsert: true
        //     };
        //     const updateDoc = {
        //         $set: {
        //             status: "approve"
        //         }
        //     };
        //     const result = await orderCollection.updateOne(filter, updateDoc);
        //     console.log("updated");
        //     res.json(result)
            
        // })


    } finally {
        // await client.close();
    }
};
run().catch(console.dir);







// Initial Server 
app.get('/', (req, res) => {
    res.send("niche website Server Is running")
});

app.listen(port, () => {
    console.log("listining to",port);
})