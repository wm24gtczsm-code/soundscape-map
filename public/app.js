



const map = L.map('map', {
  zoomSnap: 0,
  zoomDelta: 1,
  zoomControl: false,
  scrollWheelZoom: false,
  zoomAnimation: true
}).setView([35.612019, 139.578445], 10);



const mapElement = document.getElementById("map");

mapElement.addEventListener("wheel", function (e) {
  e.preventDefault();

  const currentZoom = map.getZoom();

  const isTrackpad = Math.abs(e.deltaY) < 3;

  const sensitivity = isTrackpad ? 0.5 : 0.002;

  let zoomChange = -e.deltaY * sensitivity;

  if (!isTrackpad) {
    zoomChange = zoomChange > 0 ? 0.9 : -0.9;
  }

  const nextZoom = currentZoom + zoomChange;

  map.setZoomAround(
    map.mouseEventToLatLng(e),
    nextZoom
  );
}, { passive: false });



const API_BASE_URL = "https://soundscape-map.onrender.com";

function init() {
  //スケールコントロールを最大幅200px、右下、m単位で地図に追加
  L.control.scale({ maxWidth: 200, position: 'bottomright', imperial: false }).addTo(map);
  //ズームコントロールを左下で地図に追加
  L.control.zoom({ position: 'bottomleft' }).addTo(map);
}

init();



const geocoderControl = L.Control.geocoder({
  defaultMarkGeocode: false,
  placeholder: "場所を検索",
  collapsed: false
})
  .on("markgeocode", function (e) {
    const center = e.geocode.center;

    map.setView(center, 16, {
      animate: true
    });

    const geocoderElement = geocoderControl.getContainer();
    geocoderElement.classList.remove("open");
  })
  .addTo(map);

const searchToggleButton = document.getElementById("searchToggleButton");

searchToggleButton.addEventListener("click", function () {
  console.log("検索ボタン押された");

  const geocoderElement = geocoderControl.getContainer();

  geocoderElement.classList.toggle("open");

  console.log(geocoderElement.classList);

  const input = geocoderElement.querySelector("input");

  if (geocoderElement.classList.contains("open") && input) {
    input.focus();
  }
});




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
    maxZoom: 19
  }
);



//Carto Voyager(候補1)

const cartoVoyager = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.PNG',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }
);

cartoVoyager.addTo(map);



//白紙
const blankMap = L.tileLayer(
  `data:image/svg+xml,
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="256" height="256" fill="%23146363"/>
  </svg>`,
  {
    tileSize: 256,
    attribution: ''
  }
);



const baseMaps = {
  "CARTO Voyager": cartoVoyager,
  "OpenStreetMap": osm,
  "Sound only": blankMap
};

L.control.layers(baseMaps, null, {
  position: 'topleft'
}).addTo(map);






let allSounds = [];








// スマホ判定
const isMobile = window.innerWidth <= 600;

// サイズ切り替え
const iconSize = isMobile ? 38 : 30;
const shadowSize = isMobile ? 42 : 34;

const iconAnchor = iconSize / 2;
const shadowAnchor = shadowSize / 2;

let normalIcon = L.icon({
  iconUrl: 'images/icon-new.PNG',
  shadowUrl: 'images/icon-shadow.PNG',

  iconSize: [iconSize, iconSize],
  shadowSize: [shadowSize, shadowSize],

  iconAnchor: [iconAnchor, iconAnchor],
  shadowAnchor: [shadowAnchor, shadowAnchor],

  popupAnchor: [0, 0]
});

let activeIcon = L.icon({
  iconUrl: 'images/icon-new-tap.PNG',
  shadowUrl: 'images/shadow-tap.PNG',

  iconSize: [iconSize, iconSize],
  shadowSize: [shadowSize, shadowSize],

  iconAnchor: [iconAnchor, iconAnchor],
  shadowAnchor: [shadowAnchor, shadowAnchor],

  popupAnchor: [0, 0]
});



//
// ④ マーカーと音を保存
//

let soundObjects = [];



const manuallyStoppedSoundIds = new Set();


//
// ⑤ マーカー生成
//

let markers = [];


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
  const isStopped =
    manuallyStoppedSoundIds.has(String(soundData.id));

  const toggleIconSrc = isStopped
    ? "images/sound-stopped.png"
    : "images/sound-playing.png";

  const toggleIconAlt = isStopped
    ? "この音を再生する"
    : "この音を止める";

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


    <button
  class="sound-toggle-button"
  data-id="${soundData.id}"
>
  <img
    class="sound-toggle-icon"
    src="${toggleIconSrc}"
    alt="${toggleIconAlt}"
  >
</button>


    <div class="like-section">
  <button
    class="like-button"
    data-id="${soundData.id}"
  >
    <img
      src="/images/like.png"
      alt="いいね"
    >
  </button>

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

  soundObjects.push({
    marker,
    audio: null,
    soundData: soundData
  });
}



let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function getAudioForSound(soundObj) {
  if (!soundObj.audio) {
    const audio = new Audio(soundObj.soundData.file);
    audio.loop = true;
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";

    const context = getAudioContext();
    const source = context.createMediaElementSource(audio);
    const gainNode = context.createGain();

    source.connect(gainNode);
    gainNode.connect(context.destination);

    soundObj.audio = audio;
    soundObj.gainNode = gainNode;
  }

  return soundObj.audio;
}





function clearSoundMarkers() {
  soundObjects.forEach(obj => {

    if (obj.audio) {
      obj.audio.pause();
      obj.audio.currentTime = 0;
    }

    map.removeLayer(obj.marker);
  });

  soundObjects = [];
  markers = [];
}






const soundsUrl = `${API_BASE_URL}/sounds`;
console.log("sounds url:", soundsUrl);

fetch(soundsUrl)
  .then(response => {
    console.log("sounds response:", response.status);
    return response.json();
  })
  .then(uploadedSounds => {
    console.log("sounds data:", uploadedSounds);

    allSounds = uploadedSounds;

    allSounds.forEach(sound => {
      addSoundMarker(sound);
    });
  })
  .catch(error => {
    console.error("sounds fetch error name:", error.name);
    console.error("sounds fetch error message:", error.message);
    console.error("sounds fetch error:", error);
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

  const response = await fetch(`${API_BASE_URL}/upload`, {
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



function setGainSmooth(obj, volume, fadeTime = 0.4) {
  if (!obj.gainNode || !audioContext) return;

  const now = audioContext.currentTime;
  const gain = obj.gainNode.gain;

  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(volume, now + fadeTime);
}





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
  const minZoom = 16;
  const maxZoom = 19;


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

    const soundId = String(obj.soundData.id);

    if (manuallyStoppedSoundIds.has(soundId)) {
      if (obj.audio) {
        obj.audio.pause();
        obj.audio.currentTime = 0;
      }
      return;
    }

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


    function stopAudioWithFade(obj, fadeTime = 0.6) {
      setGainSmooth(obj, 0, fadeTime);

      if (obj.stopTimer) {
        clearTimeout(obj.stopTimer);
      }

      obj.stopTimer = setTimeout(() => {
        if (obj.audio) {
          obj.audio.pause();
          obj.audio.currentTime = 0;
        }

        obj.stopTimer = null;
      }, fadeTime * 1000);
    }




    const keepAliveZoom = 13;

    if (visible && zoom >= keepAliveZoom) {
      const audio = getAudioForSound(obj);

      if (obj.stopTimer) {
        clearTimeout(obj.stopTimer);
        obj.stopTimer = null;
      }

      setGainSmooth(obj, finalVolume);

      if (audio.paused) {
        audio.play().catch(error => {
          console.log("音声再生に失敗:", obj.soundData.id, error);
        });
      }
    } else {
      stopAudioWithFade(obj);
    }

  });

}


//
// ⑨ 初回クリックで音解禁
//

map.once('click', async () => {
  unlocked = true;

  const context = getAudioContext();

  if (context.state === "suspended") {
    await context.resume();
  }

  updateSounds();
});

//ズーム時と移動時

if (isMobile) {
  map.on('moveend', updateSounds);
  map.on('zoomend', updateSounds);
} else {
  map.on('move', updateSounds);
  map.on('zoom', updateSounds);
}



let selectedAudioFile = null;
let waitingForLocation = false;
let pendingLatLng = null;
let tempMarker = null;

const audioInput = document.getElementById("audioInput");
const recordedAtInput = document.getElementById("recordedAtInput");
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






window.toggleManualSound = function (soundId) {
  const targetSound = soundObjects.find(
    obj => obj.soundData.id === soundId
  );

  if (!targetSound) return;

  if (manuallyStoppedSoundIds.has(soundId)) {
    manuallyStoppedSoundIds.delete(soundId);
  } else {
    manuallyStoppedSoundIds.add(soundId);
    if (targetSound.audio) {
      targetSound.audio.pause();
      targetSound.audio.currentTime = 0;
    }
  }

  updateSounds();
};





document.addEventListener("click", function (e) {

  const button = e.target.closest(".sound-toggle-button");

  if (!button) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const soundId = String(button.dataset.id);

  const targetSound = soundObjects.find(
    obj => String(obj.soundData.id) === soundId
  );

  if (!targetSound) {
    console.log("対象の音が見つかりません:", soundId);
    return;
  }

  const icon = button.querySelector(".sound-toggle-icon");

  if (manuallyStoppedSoundIds.has(soundId)) {
    manuallyStoppedSoundIds.delete(soundId);

    if (icon) {
      icon.src = "images/sound-playing.png";
      icon.alt = "この音を止める";
    }

  } else {
    manuallyStoppedSoundIds.add(soundId);

    targetSound.audio.pause();
    targetSound.audio.currentTime = 0;

    if (icon) {
      icon.src = "images/sound-stopped.png";
      icon.alt = "この音を再生する";
    }
  }

  updateSounds();
});








window.openDeleteRequestForm = async function (soundId) {
  const reason = prompt(
    "削除依頼の理由を書いてください。\n例：不適切な音声やコメント、著作権違反、間違えて投稿したなど"
  );

  if (!reason) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/delete-request`, {
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
  const likeButton = e.target.closest(".like-button");

  if (!likeButton) return;

  const soundId = likeButton.dataset.id;

  try {
    const response = await fetch(`${API_BASE_URL}/likes`, {
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




const uploadToggleButton =
  document.getElementById(
    "uploadToggleButton"
  );

const uploadUi =
  document.getElementById(
    "upload-ui"
  );

uploadToggleButton.addEventListener(
  "click",
  () => {
    uploadUi.classList.toggle("open");
  }
);







//フィルター

function applyDateFilter() {


  const startYear =
    document.getElementById("filterStartYear").value;

  const endYear =
    document.getElementById("filterEndYear").value;


  const startMonth =
    document.getElementById("filterStartMonth").value;

  const endMonth =
    document.getElementById("filterEndMonth").value;

  const startTime =
    document.getElementById("filterStartTime").value;

  const endTime =
    document.getElementById("filterEndTime").value;

  clearSoundMarkers();

  const filteredSounds = allSounds.filter(sound => {

    if (!sound.recordedAt) {
      return false;
    }

    const date = new Date(sound.recordedAt);


    //
    // 年判定
    //

    const year = date.getFullYear();

    if (
      !isInNormalRange(
        year,
        startYear,
        endYear
      )
    ) {
      return false;
    }




    //
    // 月判定
    //

    const month = date.getMonth() + 1;

    if (
      !isInWrappedRange(
        month,
        startMonth,
        endMonth
      )
    ) {
      return false;
    }

    //
    // 時刻判定
    //

    if (
      !isInTimeRange(
        sound.recordedAt,
        startTime,
        endTime
      )
    ) {
      return false;
    }

    return true;
  });

  filteredSounds.forEach(sound => {
    addSoundMarker(sound);
  });
}




//普通の範囲判定（年・日など）
function isInNormalRange(value, start, end) {

  if (!start && !end) {
    return true;
  }

  if (start && value < Number(start)) {
    return false;
  }

  if (end && value > Number(end)) {
    return false;
  }

  return true;
}





//循環する範囲判定（月・時刻など）
function isInWrappedRange(
  value,
  start,
  end
) {

  if (!start && !end) {
    return true;
  }

  start = Number(start);
  end = Number(end);

  if (start <= end) {
    return value >= start && value <= end;
  }

  return value >= start || value <= end;
}




//リセット
function resetDateFilter() {
  document.getElementById("filterStartMonth").value = "";
  document.getElementById("filterEndMonth").value = "";
  document.getElementById("filterStartTime").value = "";
  document.getElementById("filterEndTime").value = "";

  clearSoundMarkers();

  allSounds.forEach(sound => {
    addSoundMarker(sound);
  });
}



const filterToggleButton = document.getElementById("filterToggleButton");
const filterUi = document.getElementById("filter-ui");
const applyFilterButton = document.getElementById("applyFilterButton");
const resetFilterButton = document.getElementById("resetFilterButton");

filterToggleButton.addEventListener("click", () => {
  filterUi.classList.toggle("open");
});

applyFilterButton.addEventListener("click", applyDateFilter);
resetFilterButton.addEventListener("click", resetDateFilter);




//時刻判定
function isInTimeRange(recordedAt, startTimeValue, endTimeValue) {
  if (!startTimeValue && !endTimeValue) {
    return true;
  }

  const date = new Date(recordedAt);

  const recordedMinutes =
    date.getHours() * 60 + date.getMinutes();

  let startMinutes = 0;
  let endMinutes = 24 * 60 - 1;

  if (startTimeValue) {
    const [startHour, startMinute] = startTimeValue.split(":").map(Number);
    startMinutes = startHour * 60 + startMinute;
  }

  if (endTimeValue) {
    const [endHour, endMinute] = endTimeValue.split(":").map(Number);
    endMinutes = endHour * 60 + endMinute;
  }

  // 例：17:00〜23:00 みたいに同じ日の中で完結する場合
  if (startMinutes <= endMinutes) {
    return recordedMinutes >= startMinutes && recordedMinutes <= endMinutes;
  }

  // 例：17:00〜02:00 みたいに日付をまたぐ場合
  return recordedMinutes >= startMinutes || recordedMinutes <= endMinutes;
}










const mapLogo = document.getElementById("maplogo");

map.on("baselayerchange", function (e) {

  if (e.layer === blankMap) {
    mapLogo.src = "images/logo-e.png";
  }

  else {
    mapLogo.src = "images/logo-d.png";
  }
});










if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(() => {
        console.log("Service Worker 登録成功");
      })
      .catch(error => {
        console.log("Service Worker 登録失敗:", error);
      });
  });
}