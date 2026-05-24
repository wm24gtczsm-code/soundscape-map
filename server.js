const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

let sounds = [];



try {
  const data =
    fs.readFileSync("sounds.json", "utf8");

  sounds = JSON.parse(data);
} catch (error) {
  console.log("sounds.json読み込み失敗");
}



app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });


//新しい音をsound.jsonに追加
app.post("/upload", upload.single("audio"), (req, res) => {
  const newSound = {
    lat: Number(req.body.lat),
    lng: Number(req.body.lng),
    file: "/uploads/" + req.file.filename,
    text: req.body.text,
    userName: req.body.userName || "名無しさん",
    recordedAt: req.body.recordedAt
  };

  sounds.push(newSound);

  fs.writeFileSync(
  "sounds.json",
  JSON.stringify(sounds, null, 2)
    );

  console.log(sounds);

  res.json({
    success: true,
    sound: newSound
  });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});


app.get("/sounds", (req, res) => {
  res.json(sounds);
});