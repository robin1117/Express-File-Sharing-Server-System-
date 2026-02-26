import express from "express";

const app = express();

app.get("/directory", (req, res) => {
  res.json({
    name: "images",
    files: ["Node.png", "js.webp"],
  });
});

app.get("/folder", (req, res) => {
  // res.writeHead(301, { location: "/directory" })
  res.redirect(301,'https://www.google.com/')
  // res.status(301).setHeader('location', "/directory").end()

});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
