"use strict";

const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const Scarp = require("./controllers/Scrap");
const corsOptions = {
  origin: "http://localhost:3000", // Replace with your React.js app's URL
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(express.json());
app.use(cors(corsOptions));
app.get("/scrape", Scarp.scrap);
app.get("/", function (req, res) {
  const data = {
    avaliable_route: ["/scrape"],
    formatRequest: {
      url: "https://example.com",
      selectors: [
        {
          parentTag: ".swiper-slide",
          name: "popuper",
          children: [
            { tag: ".title", name: "image", type: "text", children: [] },
          ],
        },
      ],
    },
  };
  res.json(data);
});
let port = process.env.PORT || 5000;
// run server
app.listen(port, () => {
  console.log("Server running on port " + port);
});
