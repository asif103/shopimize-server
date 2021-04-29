const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const admin = require('firebase-admin');
const app = express()
const port = 5000
app.use(cors());
app.use(bodyParser.json());
const serviceAccount = require("./configs/shopimize-ecom-firebase-adminsdk-uqhxe-cefb1dfe52.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@notspecified.c6v9m.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const productCollection = client.db(`${process.env.DB_NAME}`).collection("products");
    const orderCollection = client.db(`${process.env.DB_NAME}`).collection("orders");
      
      app.post('/addProduct', (req, res) => {
        const newProduct = req.body;
        console.log('adding new product: ', newProduct)
        productCollection.insertOne(newProduct)
        .then(result => {
            console.log('inserted count', result.insertedCount);
            res.send(result.insertedCount > 0)
        })
      })
  
    app.get('/products', (req, res) => {
        productCollection.find()
        .toArray((err, items) => {
            res.send(items)
        })
    })
  
    app.delete('/deleteProduct/:id', (req, res) => {
      const id = ObjectID(req.params.id);
          console.log('delete this', id);
          productCollection.findOneAndDelete({_id: id})
          .then(documents => res.send(!!documents.value))
    })
  

    app.post('/addOrder', (req, res) => {
      const order = req.body;
      console.log(order);
      orderCollection.insertOne(order)
            .then(result => {
              res.send(result.insertedCount > 0)
            })
    })
    app.get('/orders', (req, res) => {
      const bearer = req.headers.authorization;
      console.log(bearer);
      if (bearer && bearer.startsWith('Bearer ')) {
              const idToken = bearer.split(' ')[1];
              admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                  const uid = decodedToken.uid;
                  const tokenEmail = decodedToken.email;
                  if (tokenEmail == req.query.email) {
                    orderCollection.find({email: req.query.email})
                    .toArray((error, documents) => {
                    res.status(200).send(documents)
                  })
                  }
                  else {
                    res.status(401).send('Unauthorized Access');
                  }
                  // ...
                })
              .catch((error) => {
                res.status(401).send('Unauthorized Access');
        });
      }
      else {
        res.status(401).send('Unauthorized Access');
      }
    })
});
  
  app.get('/', (req, res) => {
    res.send('Hello!')
  })
  
  app.listen(process.env.PORT || port)