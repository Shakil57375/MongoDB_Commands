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

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    // read doc dark : https://drive.google.com/file/d/1w1SCXXWlU2b0dq9R1k6eCtUf-UGChOqU/view?usp=sharing
    // read doc light : https://drive.google.com/file/d/1GbA42MmGAPH4xzJuZUJ6StLDQKLgN2eK/view?usp=sharing

    // insert
    app.post("/toys", async (req, res) => {
      try {
        const result = await toysCollection.insertMany({
          quality: {
            normal: "Normal",
            medium: "Medium",
            premium: "Premium",
          },
        });
        res.send(result);
      } catch (error) {
        console.error("Error inserting document:", error);
        res.status(500).send("Internal Server Error");
      }
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

    // find by specific category or methods of conditions.
    // in this case find all toy which category is football.(find the football toys)
    app.get("/findFootball", async (req, res) => {
      const toyData = await toysCollection
        .find({ category: "football" })
        .toArray();
      res.send(toyData);
    });

    // find by specific category or methods of conditions.
    // in this case we will get all the object which name is Badminton toy.
    app.get("/findByName", async (req, res) => {
      const toyData = await toysCollection
        .find({ ToyName: "Badminton toy" })
        .toArray();
      res.send(toyData);
    });

    // find by specific category or methods of conditions.
    // in this case we will get all the object which price is 220
    /* app.get("/findByPrice", async (req, res) => {
      const toyData = await toysCollection.find({ price: "220" }).toArray();
      res.send(toyData);
    }); */

    // will get the prices which are less then 500

    // app.get("/findByPrice", async (req, res) => {
    //   try {
    //     const toyData = await toysCollection
    //       .aggregate([
    //         {
    //           $addFields: {
    //             // Convert the "price" field to an integer
    //             numericPrice: { $toInt: "$price" }
    //           }
    //         },
    //         {
    //           $match: {
    //             // Filter based on the numeric value of "price"
    //             numericPrice: { $lt: 500 }
    //           }
    //         },
    //         {
    //           $project: {
    //             // Exclude the temporary field used for matching
    //             numericPrice: 0
    //           }
    //         }
    //       ])
    //       .toArray();

    //     res.send(toyData);
    //   } catch (error) {
    //     console.error("Error fetching data:", error);
    //     res.status(500).send("Internal Server Error");
    //   }
    // });

    // if you want to retrieve documents where the price is less than 1500 and the category is "football," you can combine the conditions using the $and operator.

    app.get("/findByPriceAndCategory", async (req, res) => {
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
              $match: {
                // Use $and to combine the conditions
                $and: [
                  { numericPrice: { $lt: 1500 } },
                  { category: "football" },
                ],
              },
            },
            {
              $project: {
                // Exclude the temporary field used for matching
                numericPrice: 0,
              },
            },
          ])
          .toArray();

        res.send(toyData);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // get specific elements of a document. write the elements you want or don't want in the second parameter.

    app.get("/findElements", async (req, res) => {
      try {
        const toyData = await toysCollection
          .find({ ToyName: "Badminton toy" })
          .project({
            _id: 0,
            image: 1,
            ToyName: 1,
            sellerName: 1,
            sellerEmail: 1,
            category: 1,
            rating: 1,
            quantity: 1,
            description: 1,
          })
          .toArray();

        res.send(toyData);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Complex Query Commands

    // equal to command
    app.get("/equal", async (req, res) => {
      const toyData = await toysCollection
        .find({ category: { $eq: "football" } })
        .toArray();
      res.send(toyData);
    });

    // not equal to command
    app.get("/notEqual", async (req, res) => {
      const toyData = await toysCollection
        .find({ category: { $ne: "football" } })
        .toArray();
      res.send(toyData);
    });

    // get the toys which price grater then 1000
    app.get("/getter", async (req, res) => {
      const toyData = await toysCollection
        .find({ price: { $gt: 1000 } })
        .toArray();
      res.send(toyData);
    });

    // get the toys which price lesser then 1000
    app.get("/lesser", async (req, res) => {
      const toyData = await toysCollection
        .find({ price: { $lt: 1000 } })
        .toArray();
      res.send(toyData);
    });

    // get the toys which price lesser then or equal to 220 (we can have the toys which price is grater then or equal 220 by using (gte))
    app.get("/lesserOrEqual", async (req, res) => {
      const toyData = await toysCollection
        .find({ price: { $lte: 220 } })
        .toArray();
      res.send(toyData);
    });

    // check weather the name exist to the elements or not. Here we will check the category of football and cricket it will return the object of the category football and cricket.

    app.get("/In", async (req, res) => {
      const toyData = await toysCollection
        .find({ category: { $in: ["football", "cricket"] } })
        .toArray();
      res.send(toyData);
    });
    // we can also check all the data which is not exist or you can said that it will return the data which will not math the condition.  Here we will check the category of football and cricket it will return the object of the objects which category is not football and cricket.

    app.get("/notIn", async (req, res) => {
      const toyData = await toysCollection
        .find({ category: { $nin: ["football", "cricket"] } })
        .toArray();
      res.send(toyData);
    });

    // will check if the key exist or not. here we are checking those objects which price key is not exist.

    app.get("/notExist", async (req, res) => {
      const toyData = await toysCollection
        .find({
          $and: [
            { rating: { $exists: false } },
            { price: { $exists: false } },
            { quantity: { $exists: false } },
          ],
        })
        .toArray();
      res.send(toyData);
    });

    // above example we are using multiple conditions if you want to use one then you can follow this example

    /*  app.get("/notExist", async (req, res) => {
      const toyData = await toysCollection
        .find({ rating: { $exists: false } } )
        .toArray();
      res.send(toyData);
    }); */

    // know we will check the exist method it will return those object which price is exist.
    app.get("/exist", async (req, res) => {
      const toyData = await toysCollection
        .find({ price: { $exists: true } })
        .toArray();
      res.send(toyData);
    });

    // check price less then 500 and grater then 200

    app.get("/lessAndGrater", async (req, res) => {
      const toyData = await toysCollection
        .find({ price: { $gt: 200, $lt: 500 } })
        .toArray();
      res.send(toyData);
    });

    // check price less then or equal 500 and grater then or equal 200 and check the category also.

    app.get("/lessAndGraterAndName", async (req, res) => {
      const toyData = await toysCollection
        .find({ price: { $gte: 200, $lte: 500 }, category: "cricket" })
        .toArray();
      res.send(toyData);
    });

    // and query  (generally, you don't need to use that $and very much because you can do all in one query like (//!{ price: { $gte: 200, $lte: 500 }, category: "cricket" }))
    // if you want you can use $and to apply multiple conditions.

    app.get("/andQuery", async (req, res) => {
      const toyData = await toysCollection
        .find({
          $and: [{ price: { $gte: 200, $lte: 500 } }, { category: "football" }],
        })
        .toArray();
      res.send(toyData);
    });

    //* or query

    app.get("/orQuery", async (req, res) => {
      const toyData = await toysCollection
        .find({
          $or: [{ price: { $gte: 0, $lte: 300 } }, { category: "hokey" }],
        })
        .toArray();
      res.send(toyData);
    });

    // ? not query
    // will return the documents which price is grater then 1000 & which price key is not available
    app.get("/notQuery", async (req, res) => {
      const toyData = await toysCollection
        .find({
          price: { $not: { $lte: 1000 } },
        })
        .toArray();
      res.send(toyData);
    });

    // will return the prices which is less then 1000
    app.get("/returnPrice", async (req, res) => {
      const toyData = await toysCollection
        .find({
          price: { $lte: 1000 },
        })
        .toArray();
      res.send(toyData);
    });

    // expression query
    // will return the documents which rating is grater then quantity.
    app.get("/expression", async (req, res) => {
      const toyData = await toysCollection
        .find({
          $expr: { $gt: ["$rating", "$quantity"] },
        })
        .toArray();
      res.send(toyData);
    });

    app.get("/expression", async (req, res) => {
      const toyData = await toysCollection
        .find({
          $expr: { $gt: ["$rating", "$quantity"] },
        })
        .toArray();
      res.send(toyData);
    });

    // we can get an specific object by using the key and value of the specific object. (we can use the dot notation  by using an object inside an object )
    /* 
    as an example : 
    quality: {
    normal: "Normal",
    medium: "medium",
    premium: "premium"
  }
  we can access this object by using app.get("/withElement", async (req, res) => {
      const toyData = await toysCollection
        .find({
          "quality.normal" : "Normal" // it will return the object.
        })
        .toArray();
      res.send(toyData);
    });
     */

    app.get("/withElement", async (req, res) => {
      const toyData = await toysCollection
        .find({
          price: 1213,
        })
        .toArray();
      res.send(toyData);
    });

    // find single data with a specific condition.

    app.get("/singleData", async (req, res) => {
      const toyData = await toysCollection.findOne({
        price: { $lte: 1000 },
      });
      res.send(toyData);
    });

    // find many data is avilable with the specific conditions.

    app.get("/countData", async (req, res) => {
      try {
        // Use the countDocuments method to count documents in the "toysCollection"
        // that meet the specified condition (price <= 1500).
        const toyData = await toysCollection.countDocuments({
          price: { $lte: 500 },
        });

        // Send the counted data as a response.
        res.send(String(toyData)); // Convert to string to avoid the deprecation warning
      } catch (error) {
        console.error(error);
        res.sendStatus(500); // Internal Server Error
      }
    });

    // get document with specific email

    app.get("/myToys/:email", async (req, res) => {
      console.log("line80", req.params?.email);
      if (req.params?.email) {
        const result = await toysCollection
          .find({ sellerEmail: req.params.email })
          .toArray();
        return res.send(result);
      }
      const result = await toysCollection.find().toArray();
      res.send(result);
    });

    // update data.

    // app.patch("/toys", async (req, res) => {
    //   const toyData = await toysCollection.updateOne(
    //     { category: "football" },
    //     { $set: { category: "basketball" } }
    //   );
    //   res.send(toyData);
    // });

    // update

    app.put("/updateToys/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          price: body.price,
          quantity: body.quantity,
          description: body.description,
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    // incrementPrice
    app.put("/incrementPrice/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $inc: {
          price: 3,
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    // rename key
    app.put("/renameKey/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $rename: {
          description: "details",
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    // removing key value or you can say property
    app.put("/removeProperty/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $unset: {
          quantity: "",
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    // adding key value or you can say property (if we push anything it will add as an array.)
    app.put("/addProperty/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $push: {
          quantity: 4,
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });


    // pull key value or you can say property(actually, it's removing the existing element like we added/push quantity : 4 in the previous example know we are pulling or removing the value of 4)
    app.put("/updatingProperty/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = {
        $pull: {
          quantity: 4
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
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
