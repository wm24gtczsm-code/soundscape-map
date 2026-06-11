const cors = require("cors");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);






require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    }
  })
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get("/sounds", async (req, res) => {
  const { data, error } = await supabase
    .from("sounds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
  console.error("sounds取得エラー:", error);
  return res.status(500).json({
    error: "sounds取得失敗",
    detail: error.message
  });
}

  const sounds = data.map(sound => ({
    id: sound.id, 
    lat: sound.lat,
    lng: sound.lng,
    file: sound.file_url,
    text: sound.text,
    userName: sound.user_name || "名無しさん",
    recordedAt: sound.recorded_at,
    likes_count: sound.likes_count || 0
  }));

  res.json(sounds);
});








// いいね数を +1 するAPI
app.post('/api/sounds/:id/like', async (req, res) => {
  const soundId = req.params.id;

  try {
    // まず今の likes_count を取得
    const { data: sound, error: fetchError } = await supabase
      .from('sounds')
      .select('likes_count')
      .eq('id', soundId)
      .single();

    if (fetchError) {
      console.error(fetchError);
      return res.status(500).json({ error: 'いいね数の取得に失敗しました' });
    }

    const currentLikes = sound.likes_count || 0;
    const newLikes = currentLikes + 1;

    // likes_count を +1 して更新
    const { data, error: updateError } = await supabase
      .from('sounds')
      .update({ likes_count: newLikes })
      .eq('id', soundId)
      .select()
      .single();

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ error: 'いいねの更新に失敗しました' });
    }

    res.json({
      message: 'いいねしました',
      likes_count: data.likes_count
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});










app.post("/upload", upload.single("audio"), async (req, res) => {
  let inputPath;
  let convertedPath;

  try {
    inputPath = req.file.path;

    let uploadBuffer;
    let contentType;
    let fileName;

    fileName = `${Date.now()}.mp3`;
convertedPath = `uploads/${fileName}`;

await new Promise((resolve, reject) => {
  ffmpeg(inputPath)

    .toFormat("mp3")
    .audioBitrate("128k")

    .on("end", resolve)
    .on("error", reject)

    .save(convertedPath);
});

uploadBuffer = fs.readFileSync(convertedPath);
contentType = "audio/mpeg";

    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sounds")
      .upload(filePath, uploadBuffer, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error(uploadError);
      return res.status(500).json({ error: "アップロード失敗" });
    }

    const { data: publicUrlData } = supabase.storage
      .from("sounds")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    const newSound = {
      lat: Number(req.body.lat),
      lng: Number(req.body.lng),
      file_url: fileUrl,
      file_path: filePath,
      text: req.body.text,
      user_name: req.body.userName || "名無しさん",
      recorded_at: req.body.recordedAt
    };

    const { data, error: insertError } = await supabase
      .from("sounds")
      .insert(newSound)
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ error: "データ保存失敗" });
    }

    res.json({
      success: true,
      sound: {
        id: data.id,
        lat: data.lat,
        lng: data.lng,
        file: data.file_url,
        text: data.text,
        userName: data.user_name || "名無しさん",
        recordedAt: data.recorded_at,
        likes_count: data.likes_count || 0
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "アップロード失敗" });

  } finally {
    if (inputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    if (convertedPath && fs.existsSync(convertedPath)) {
      fs.unlinkSync(convertedPath);
    }
  }
});







app.post('/delete-request', async (req, res) => {
  const { soundId, reason } = req.body;

  if (!soundId || !reason) {
    return res.status(400).json({ error: 'soundId and reason are required' });
  }

  const { error } = await supabase
    .from('delete_requests')
    .insert([
      {
        sound_id: soundId,
        reason: reason,
        status: 'pending'
      }
    ]);

  if (error) {
    console.error('削除依頼保存エラー:', error);
    return res.status(500).json({ error: 'Failed to save delete request' });
  }

  res.json({ success: true });
});




const PORT = process.env.PORT || 3000;

app.listen(PORT,"0.0.0.0", () => {
  console.log(`http://localhost:${PORT}`);
});

