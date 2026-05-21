const map = L.map('map', {
    zoomSnap: 0.25
}).setView([35.6026, 139.3483], 15);



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


//openstreetmap
/*
L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
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


//Carto Voyager(候補1)

L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.PNG',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }
).addTo(map);











const points = [

  {
    lat: 35.717927,
    lng: 139.765221,
    sound: 'audio/16時根津.mp3',
    text: '2026.5.16.16:00'
  },

  {
    lat: 35.692152,
    lng: 139.702084,
    sound: 'audio/19時新宿タカキュー.mp3',
    text: '2026.5.16.19:00'
  },

  {
    lat: 35.656770,
    lng: 139.340186,
    sound: 'audio/18時半JR八王子駅アイロードエスカレーター前.mp3',
    text: '2026.5.18.18:30'
  }

];


let greenIcon = L.icon({
    iconUrl: 'images/icon-audio.PNG',
    shadowUrl: 'images/icon-shadow.PNG',
    iconSize:     [30, 30], // size of the icon
    shadowSize: [34,34],
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    shadowAnchor: [17,16.5],
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});



//
// ④ マーカーと音を保存
//

const soundObjects = [];


//
// ⑤ マーカー生成
//

points.forEach(point => {

  // マーカー
  const marker = L.marker([point.lat, point.lng],{icon: greenIcon})
    .addTo(map)
    .bindPopup(point.text);

  // 音
  const audio = new Audio(point.sound);

  // ループ
  audio.loop = true;

  //
// 初期音量
//
audio.volume = 0;


//
// 保存
//
soundObjects.push({
marker,
audio
});

});


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
const maxDistance = 500;


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















