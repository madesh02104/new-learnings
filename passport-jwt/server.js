const express = require("express");
const app = express();

const jwt = require("jsonwebtoken");

app.use(express.json());

const posts = [
  {
    username: "JohnDoe",
    title: "Post 1",
  },
  {
    username: "Kyle",
    title: "Post 2",
  },
];

app.get("/posts", (req, res) => {
  res.json(posts);
});

app.post("/login", (req, res) => {
  // Authenticate User

  const username = req.body.username;

  jwt.sign()
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
