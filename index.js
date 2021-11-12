const express = require("express");
var cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
var admin = require("firebase-admin");
const port = process.env.PORT || 5000;
const app = express();

var serviceAccount = require("./niche-website-drone-firebase-adminsdk-bclx5-638c4ccd2c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Use middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0f9z2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  const authorization = req?.headers?.authorization;
  if (authorization) {
    const idToken = authorization.split("Bearer ")[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const db_name = "nich_website";
    const db = client.db(db_name);
    const productCollection = db.collection("product");
      const orderCollection = db.collection("order_collection");
      const userCollection = db.collection('user')
      const reviewCollection = db.collection('review_collection')

    // // Get api (Get All Products)
    app.get("/products", async (req, res) => {
      const home = req.query.home;
      if (home) {
        const cursor = productCollection.find({}).limit(6);
        const places = await cursor.toArray();
        res.send(places);
      } else {
        const cursor = productCollection.find({});
        const places = await cursor.toArray();
        res.send(places);
      }
    });

    // Get my order Orders
      app.get("/orders", verifyToken, async (req, res) => {
        let query = {};
      const email = req.query.email;
      if (req?.decodedEmail === email) {
        query = { email: email };
        const cursor = orderCollection.find(query);
        const places = await cursor.toArray();
        res.send(places);
      } else {
          res.send(401).json({message:'User not Authorize'})
      }
      });
      
    //   Get User 
      app.get('/user/:email', async(req, res) => {
          const email = req.params.email;
          const query = { email: email };
          const user = await userCollection.findOne(query);
          let isAdmin = false;
          if (user?.role === 'admin') {
              isAdmin = true;
          }
          res.json({admin:isAdmin})
      })


    // Get All order Orders
      app.get("/orders/manage", verifyToken, async (req, res) => {
        const cursor = orderCollection.find({});
        const places = await cursor.toArray();
        res.send(places);
      });
    
    // Get Review 
      app.get("/review",async (req, res) => {
        const cursor = reviewCollection.find({});
        const places = await cursor.toArray();
        res.send(places);
    });

    // Post api (Add Products)
    app.post("/addproduct", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.json(result);
    });

    // Add Review 
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.json(result);
    });
      
    //   Add Users 
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.json(result);
    });
      
    //   Add User From Google Log in 
      app.put('/user', async(req, res) => {
          const user = req.body;
          const filter = { email: user.email };
          const options = { upsert: true };
          const updateDoc = { $set: user }
          const result =await userCollection.updateOne(filter, updateDoc, options)
          res.json(result)
      })
      
    //   Add admin
      app.put('/user/admin', async(req, res) => {
          const user = req.body;
          const filter = { email: user.email };
          const updateDoc = { $set: {role:'admin'} }
          const result =await userCollection.updateOne(filter, updateDoc)
          res.json(result);
    })

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
}
run().catch(console.dir);

// Initial Server
app.get("/", (req, res) => {
  res.send("niche website Server Is running");
});

app.listen(port, () => {
  console.log("listining to", port);
});
