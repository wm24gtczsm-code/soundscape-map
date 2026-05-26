const map = L.map('map', {
  zoomSnap: 0.25,
  zoomDelta: 0.25,
  zoomControl: false,
  // ホイール感度を上げる
  wheelPxPerZoomLevel: 20,

  zoomAnimation: true
}).setView([35.612019, 139.578445], 10);


function init() {
  //スケールコントロールを最大幅200px、右下、m単位で地図に追加
  L.control.scale({ maxWidth: 200, position: 'bottomright', imperial: false }).addTo(map);
  //ズームコントロールを左下で地図に追加
  L.control.zoom({ position: 'bottomleft' }).addTo(map);
}

init();

//CARTO
/*
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }


).addTo(map);
*/
//わかりました




//Stadia Alidade Smooth
/*
L.tileLayer(
  'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
  {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors &copy; Stadia Maps'
  }
).addTo(map);
*/


//openstreetmap

const osm = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20
    }
);



//Carto Voyager(候補1)

const cartoVoyager = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.PNG',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }
);

cartoVoyager.addTo(map);



const baseMaps = {
  "CARTO Voyager": cartoVoyager,
  "OpenStreetMap": osm
};

L.control.layers(baseMaps).addTo(map);








let normalIcon = L.icon({
  iconUrl: 'images/icon-new.PNG',
  shadowUrl: 'images/icon-shadow.PNG',
  iconSize: [30, 30], // size of the icon
  shadowSize: [34, 34],
  iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
  shadowAnchor: [17, 16.5],
  popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
});

let activeIcon = L.icon({
  iconUrl: 'images/icon-new-tap.PNG',
  shadowUrl: 'images/shadow-tap.PNG',
  iconSize: [30, 30], // size of the icon
  shadowSize: [34, 34],
  iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
  shadowAnchor: [17, 16.5],
  popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
});



//
// ④ マーカーと音を保存
//

const soundObjects = [];


//
// ⑤ マーカー生成
//

const markers = [];


function formatDate(value) {
  if (!value) return "日時未設定";

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}






function createPopupContent(soundData) {
  return `
<div>
  ${soundData.text || "説明なし"}
  <br>
  (${formatDate(soundData.recordedAt)}/
  ${soundData.userName || "名無しさん"})

  <br>

  <div class="popup-actions">

    <button
      class="delete-request-button"
      onclick="openDeleteRequestForm('${soundData.id}')"
    >
      <img src="images/delete-request.png" alt="削除依頼">
    </button>

    <div class="like-section">
      <img
        class="like-button"
        src="/images/like.png"
        data-id="${soundData.id}"
        width="24"
      >

      <span id="like-count-${soundData.id}">
        ${soundData.likes_count || 0}
      </span>
    </div>

  </div>
</div>
`;
}










function addSoundMarker(soundData) {

  const marker = L.marker(
    [soundData.lat, soundData.lng],
    { icon: normalIcon }
  ).addTo(map);

  marker.bindPopup(() => createPopupContent(soundData));

  markers.push(marker);

  marker.on('click', (e) => {
    L.DomEvent.stopPropagation(e.originalEvent);

    markers.forEach(marker => {
      marker.setIcon(normalIcon);
    });

    marker.setIcon(activeIcon);
  });

  const audio = new Audio(soundData.sound || soundData.file);
  audio.loop = true;
  audio.volume = 0;

  soundObjects.push({
    marker,
    audio,
    soundData
  });

}







fetch("/sounds")
  .then(response => response.json())
  .then(uploadedSounds => {
    uploadedSounds.forEach(sound => {
      addSoundMarker(sound);
    });
  });



//マップクリックで選択解除

map.on('click', (e) => {

  // 全部青に戻す
  markers.forEach(marker => {
    marker.setIcon(normalIcon);
  });



  //アップロード時の挙動
  if (!waitingForLocation || !selectedAudioFile) {
    return;
  }

  pendingLatLng = e.latlng;

  if (tempMarker) {
    map.removeLayer(tempMarker);
  }

   const popupContent = document.createElement("div");

  popupContent.innerHTML = `
    <p>ここに音を置きますか？</p>
    <button id="replaceButton">置き直す</button>
    <button id="confirmButton">確定</button>
  `;

  tempMarker = L.marker(
    [pendingLatLng.lat, pendingLatLng.lng],
    { icon: activeIcon }
  ).addTo(map);

  tempMarker.bindPopup(popupContent).openPopup();

  popupContent
    .querySelector("#replaceButton")
    .addEventListener("click", () => {
      map.removeLayer(tempMarker);
      tempMarker = null;
      pendingLatLng = null;

      uploadStatus.textContent =
        "もう一度、地図上の置きたい場所をクリックしてください。";
    });

  popupContent
    .querySelector("#confirmButton")
    .addEventListener("click", () => {
      uploadSoundAt(pendingLatLng);
    });

  uploadStatus.textContent =
    "位置を確認して、確定してください。";
});



async function uploadSoundAt(latlng) {
  const formData = new FormData();

  formData.append("audio", selectedAudioFile);
  formData.append("lat", latlng.lat);
  formData.append("lng", latlng.lng);
  formData.append("userName", userNameInput.value.trim() || "名無しさん");
  formData.append("text", soundTextInput.value);
  formData.append("recordedAt", recordedAtInput.value);

  uploadStatus.textContent = "アップロード中...";

  const response = await fetch("/upload", {
    method: "POST",
    body: formData
  });

  if (response.ok) {
    const data = await response.json();

    uploadStatus.textContent = "アップロード完了";

    addSoundMarker(data.sound);

    selectedAudioFile = null;
    waitingForLocation = false;
    pendingLatLng = null;

    audioInput.value = "";
    soundTextInput.value = "";
    userNameInput.value = "名無しさん";
    recordedAtInput.value = "";

    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }

    showStep(stepFile);
    updateSounds();

  } else {
    uploadStatus.textContent = "アップロードに失敗しました";
  }
}







//
// ⑦ 音解禁フラグ
//

let unlocked = false;


//
// ⑧ 音更新関数
//

function updateSounds() {

  //
  // 初回クリック前は何もしない
  //
  if (!unlocked) return;


  //
  // 表示範囲
  //
  const bounds = map.getBounds();

  //
  // 地図中心
  //
  const center = map.getCenter();

  //
  // 現在ズーム
  //
  const zoom = map.getZoom();


  //
  // ズーム設定
  //
  const minZoom = 15;
  const maxZoom = 20;


  //
  // 距離設定（m）
  //
  const maxDistance = 10000;


  //
  // ズーム倍率から音量計算
  // 0〜1
  //
  let zoomVolume =
    (zoom - minZoom) /
    (maxZoom - minZoom);

  zoomVolume = Math.max(
    0,
    Math.min(1, zoomVolume)
  );


  //
  // 全音源チェック
  //
  soundObjects.forEach(obj => {

    const marker = obj.marker;
    const audio = obj.audio;

    const latlng = marker.getLatLng();


    //
    // 画面内か
    //
    const visible = bounds.contains(latlng);


    //
    // 地図中心から距離計算
    //
    const distance =
      center.distanceTo(latlng);


    //
    // 距離減衰
    // 近いほど1
    // 遠いほど0
    //
    let distanceVolume =
      1 - (distance / maxDistance);

    distanceVolume = Math.max(
      0,
      Math.min(1, distanceVolume)
    );


    //
    // 最終音量
    // ズーム × 距離
    //
    const finalVolume =
      zoomVolume * distanceVolume;


    //
    // 再生条件
    //
    if (visible && finalVolume > 0) {

      //
      // 音量反映
      //
      audio.volume = finalVolume;

      //
      // 停止中なら再生
      //
      if (audio.paused) {

        audio.play();

      }

    }

    //
    // 画面外 or 無音
    //
    else {

      audio.pause();

      //
      // 戻った時最初から
      //
      audio.currentTime = 0;

    }

  });

}


//
// ⑨ 初回クリックで音解禁
//

map.once('click', () => {

  unlocked = true;

  updateSounds();

});


//
// ⑩ 地図移動時
//

map.on('move', updateSounds);


//
// ⑪ ズーム時
//

map.on('zoom', updateSounds);




let selectedAudioFile = null;
let waitingForLocation = false;
let pendingLatLng = null;
let tempMarker = null;

const audioInput = document.getElementById("audioInput");
const recordedAtInput =document.getElementById("recordedAtInput");
const soundTextInput = document.getElementById("soundTextInput");
const uploadStatus = document.getElementById("upload-status");
const dateNextButton = document.getElementById("dateNextButton");
const stepFile = document.getElementById("step-file");
const fileNextButton = document.getElementById("fileNextButton");
const stepDate = document.getElementById("step-date");
const stepText = document.getElementById("step-text");
const stepUser = document.getElementById("step-user");
const userNameInput = document.getElementById("userNameInput");
const userNextButton = document.getElementById("userNextButton");

function showStep(step) {
  stepFile.classList.remove("active");
  stepDate.classList.remove("active");
  stepUser.classList.remove("active");
  stepText.classList.remove("active");

  step.classList.add("active");
}

showStep(stepFile);



audioInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (!file) {
    selectedAudioFile = null;
    uploadStatus.textContent = "音声ファイルを選択してください。";
    return;
  }

  selectedAudioFile = file;
  uploadStatus.textContent = "音声ファイルを選択しました。次へ進んでください。";
});

console.log(fileNextButton);

fileNextButton.addEventListener("click", () => {
  if (!selectedAudioFile) {
    uploadStatus.textContent = "先に音声ファイルを選択してください。";
    return;
  }

  uploadStatus.textContent = "録音日を選択してください。";
  showStep(stepDate);
});



dateNextButton.addEventListener("click", () => {
  if (!recordedAtInput.value) {
    uploadStatus.textContent =
      "録音日を選択してください。";
    return;
  }

  uploadStatus.textContent = "ユーザー名を記入してください。";

  showStep(stepUser);
  });

userNextButton.addEventListener("click", () => {
  if (!userNameInput.value.trim()) {
    userNameInput.value = "名無しさん";
  }

  uploadStatus.textContent = "コメントを書いてください。";

  showStep(stepText);
});


const textNextButton =
  document.getElementById("textNextButton");

textNextButton.addEventListener("click", () => {

  waitingForLocation = true;

  uploadStatus.textContent =
    "地図上の置きたい場所をクリックしてください。";
});









window.openDeleteRequestForm = async function (soundId) {
  const reason = prompt(
    "削除依頼の理由を書いてください。\n例：不適切な音声やコメント、著作権違反、間違えて投稿したなど"
  );

  if (!reason) {
    return;
  }

  try {
    const res = await fetch('/delete-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        soundId: soundId,
        reason: reason
      })
    });

    if (!res.ok) {
      throw new Error('削除依頼の送信に失敗しました');
    }

    alert('削除依頼を送信しました');
  } catch (error) {
    console.error(error);
    alert('削除依頼の送信に失敗しました');
  }
};






// いいね画像をクリックしたときの処理
document.addEventListener('click', async function (e) {
  if (!e.target.classList.contains('like-button')) return;

  const soundId = e.target.dataset.id;

  try {
    const response = await fetch(`/api/sounds/${soundId}/like`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert('いいねに失敗しました');
      return;
    }

    const countElement = document.getElementById(`like-count-${soundId}`);

    if (countElement) {
      countElement.textContent = data.likes_count;
    }


const targetSound = soundObjects.find(
  obj => obj.soundData.id === soundId
);

if (targetSound) {
  targetSound.soundData.likes_count =
    data.likes_count;
}



  } catch (error) {
    console.error(error);
    alert('通信エラーでいいねできませんでした');
  }
});











