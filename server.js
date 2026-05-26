
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();


app.use(express.json());
app.use(express.static("public"));

const upload = multer({
  storage: multer.memoryStorage()
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
    recordedAt: sound.recorded_at
  }));

  res.json(sounds);
});

app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    const ext = path.extname(req.file.originalname);
    const fileName = `${Date.now()}${ext}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sounds")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error(uploadError);
      return res.status(500).json({ error: "音声アップロード失敗" });
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
        recordedAt: data.recorded_at
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "アップロード失敗" });
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

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});