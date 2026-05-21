const map = L.map('map', {
    zoomSnap: 0.25
}).setView([35.612019, 139.578445], 10);



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
    sound: 'audio/16-nezu.mp3',
    text: '東大の五月祭の日(2026.5.16.16:00)'
  },

  {
    lat: 35.692152,
    lng: 139.702084,
    sound: 'audio/19-shinjyuku-takaq.mp3',
    text: 'ガヤガヤしてる(2026.5.16.19:00)'
  },

  {
    lat: 35.656770,
    lng: 139.340186,
    sound: 'audio/18.5-hachioji-iroad-es.mp3',
    text: '仕事帰りの人たちがいっぱいいます(2026.5.18.18:30)'
  },

  {
    lat: 35.61244085,
    lng: 139.6275106,
    sound: 'audio/16-nikotama-home.mp3',
    text: '電車通学の私立小学生の集団。何ひとつ不自由のなさそうな笑顔がまぶしい。はあ。。。(2026.5.21.16:00)'
  },

  {
    lat: 35.5953844,
    lng: 139.355995,
    sound: 'audio/10-big-a.mp3',
    text: 'ここ自転車で通ると車が危ないんだよないつも(2026.5.20.10:00)'
  }

];


let normalIcon = L.icon({
    iconUrl: 'images/icon-audio.PNG',
    shadowUrl: 'images/icon-shadow.PNG',
    iconSize:     [30, 30], // size of the icon
    shadowSize: [34,34],
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    shadowAnchor: [17,16.5],
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});

let activeIcon = L.icon({
    iconUrl: 'images/icon-tap.PNG',
    shadowUrl: 'images/shadow-tap.PNG',
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

const markers = [];

points.forEach(point => {

  const marker = L.marker(
    [point.lat, point.lng],
    { icon: normalIcon }
  ).addTo(map);

  // ← これが重要
marker.bindPopup(point.text);


  markers.push(marker);

  marker.on('click', () => {

    // 全部青に戻す
    markers.forEach(m => {
      m.setIcon(normalIcon);
    });

    // 押したやつだけ赤
    marker.setIcon(activeIcon);

  });




//マップクリックで選択解除

map.on('click', () => {

  markers.forEach(marker => {
    marker.setIcon(normalIcon);
  });

});
  
marker.on('click', (e) => {

  // mapへのクリック伝播を止める
  L.DomEvent.stopPropagation(e);

  markers.forEach(marker => {
    marker.setIcon(normalIcon);
  });

  marker.setIcon(activeIcon);

});



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















