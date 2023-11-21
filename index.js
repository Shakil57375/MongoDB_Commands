const express = require("express");
const app = express();
require("dotenv").config();
// PORT
const PORT = process.env.PORT || 3000;
app.use(express.json());
// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lc40fqb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const toysCollection = client.db("ToyDB").collection("toys");
    // Connect the client to the server	(optional starting in v4.7)
    // post method
    app.post("/toys", async (req, res) => {
      const toyData = req.body;
      const result = await toysCollection.insertOne(toyData);
      res.send(result);
    });

    app.get("/toys", async (req, res) => {
      const toyData = await toysCollection.find().toArray();
      res.send(toyData);
    });

    // get tow Data by using limit
    app.get("/limit", async (req, res) => {
      const toyData = await toysCollection.find().limit(2).toArray();
      res.send(toyData);
    });

    // get data by sorting descending by category
    // we can sort multiple item at a time.
    app.get("/sortDescending", async (req, res) => {
      const toyData = await toysCollection
        .find()
        .sort({ ToyName: -1, category: -1 })
        .toArray();
      res.send(toyData);
    });

    // get data by sorting ascending by price when the value will be numbers this method will work.
    /*  app.get("/sortAscending", async (req, res) => {
      try {
        const toyData = await toysCollection
          .find()
          .sort({ price: 1 })
          .toArray();
        res.send(toyData);
      } catch (error) {
        console.error("Error fetching and sorting data:", error);
        res.status(500).send("Internal Server Error");
      }
    }); */

    // when the price is a string we have to use this method.

    app.get("/sortAscending", async (req, res) => {
      try {
        const toyData = await toysCollection
          .aggregate([
            {
              $addFields: {
                // Convert the "price" field to an integer
                numericPrice: { $toInt: "$price" },
              },
            },
            {
              $sort: { numericPrice: 1 },
            },
            {
              $project: {
                // Exclude the temporary field used for sorting
                numericPrice: 0,
              },
            },
          ])
          .toArray();

        res.send(toyData);
      } catch (error) {
        console.error("Error fetching and sorting data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // skip object

    app.get("/skip", async (req, res) => {
      const toyData = await toysCollection.find().limit(3).skip(2).toArray();
      res.send(toyData);
    });

    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This is home page.");
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
