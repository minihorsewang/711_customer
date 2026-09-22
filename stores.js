// ---------------------------------------------------------------------
// Demo 7-ELEVEN store dataset (mock data for prototype only).
// Real implementation should call the official 7-11 store lookup —
// e.g. ECPay/NewebPay "Logistics Map" (超商電子地圖) API, which returns
// the live CVSStoreID / CVSStoreName / CVSAddress after the seller
// picks a store on the official map. See README for integration notes.
// ---------------------------------------------------------------------

// Full list of Taiwan counties/cities, matching the layout of the real
// 7-ELEVEN electronic map's city grid. Every city now has at least a
// couple of demo stores in STORE_DB below so the grid has no disabled
// buttons — still entirely made-up data, not the real store network.
const ALL_TAIWAN_CITIES = [
  "基隆市", "台北市", "新北市", "桃園市",
  "新竹市", "新竹縣", "苗栗縣", "台中市",
  "南投縣", "彰化縣", "嘉義市", "嘉義縣",
  "台南市", "高雄市", "屏東縣", "宜蘭縣",
  "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣",
];

const STORE_CITIES = [...ALL_TAIWAN_CITIES];

const STORE_DB = [
  { code: "123456", name: "台北車站門市", city: "台北市", addr: "台北市中正區忠孝西路一段49號" },
  { code: "234567", name: "西門好樣門市", city: "台北市", addr: "台北市萬華區漢中街50號" },
  { code: "345678", name: "信義安和門市", city: "台北市", addr: "台北市大安區信義路四段1號" },
  { code: "456789", name: "士林夜市門市", city: "台北市", addr: "台北市士林區文林路101號" },
  { code: "567890", name: "板橋車站門市", city: "新北市", addr: "新北市板橋區縣民大道二段7號" },
  { code: "678901", name: "新莊興漢門市", city: "新北市", addr: "新北市新莊區中正路100號" },
  { code: "789012", name: "永和樂華門市", city: "新北市", addr: "新北市永和區樂華街12號" },
  { code: "890123", name: "桃園藝文門市", city: "桃園市", addr: "桃園市桃園區藝文路38號" },
  { code: "901234", name: "中壢中央門市", city: "桃園市", addr: "桃園市中壢區中央路二段99號" },
  { code: "112233", name: "台中一中門市", city: "台中市", addr: "台中市北區三民路三段18號" },
  { code: "223344", name: "逢甲夜市門市", city: "台中市", addr: "台中市西屯區文華路30號" },
  { code: "334455", name: "台中火車站門市", city: "台中市", addr: "台中市中區台灣大道一段1號" },
  { code: "445566", name: "台南安平門市", city: "台南市", addr: "台南市安平區安平路300號" },
  { code: "556677", name: "台南成大門市", city: "台南市", addr: "台南市東區大學路5號" },
  { code: "667788", name: "高雄美麗島門市", city: "高雄市", addr: "高雄市新興區中山一路280號" },
  { code: "778899", name: "高雄夢時代門市", city: "高雄市", addr: "高雄市前鎮區中華五路789號" },

  { code: "200111", name: "基隆廟口門市", city: "基隆市", addr: "基隆市仁愛區仁三路45號" },
  { code: "200222", name: "基隆港務門市", city: "基隆市", addr: "基隆市中正區中正路1號" },

  { code: "300111", name: "新竹城隍廟門市", city: "新竹市", addr: "新竹市北區中山路75號" },
  { code: "300222", name: "新竹清大門市", city: "新竹市", addr: "新竹市東區光復路二段101號" },

  { code: "302111", name: "竹北高鐵門市", city: "新竹縣", addr: "新竹縣竹北市高鐵七路6號" },
  { code: "302222", name: "竹東仁愛門市", city: "新竹縣", addr: "新竹縣竹東鎮仁愛路100號" },

  { code: "360111", name: "苗栗火車站門市", city: "苗栗縣", addr: "苗栗縣苗栗市中山路1號" },
  { code: "360222", name: "竹南運動場門市", city: "苗栗縣", addr: "苗栗縣竹南鎮中華路50號" },

  { code: "540111", name: "南投中興新村門市", city: "南投縣", addr: "南投縣南投市中興路100號" },
  { code: "540222", name: "埔里愛蘭門市", city: "南投縣", addr: "南投縣埔里鎮愛蘭路20號" },

  { code: "500111", name: "彰化扇形車庫門市", city: "彰化縣", addr: "彰化縣彰化市彰美路一段1號" },
  { code: "500222", name: "員林中山門市", city: "彰化縣", addr: "彰化縣員林市中山路二段88號" },

  { code: "600111", name: "嘉義文化路門市", city: "嘉義市", addr: "嘉義市東區文化路120號" },
  { code: "600222", name: "嘉義火車站門市", city: "嘉義市", addr: "嘉義市西區中山路1號" },

  { code: "613111", name: "朴子中正門市", city: "嘉義縣", addr: "嘉義縣朴子市中正路50號" },
  { code: "621111", name: "民雄中正大學門市", city: "嘉義縣", addr: "嘉義縣民雄鄉大學路168號" },

  { code: "900111", name: "屏東勝利門市", city: "屏東縣", addr: "屏東縣屏東市勝利路30號" },
  { code: "947111", name: "墾丁大街門市", city: "屏東縣", addr: "屏東縣恆春鎮墾丁路168號" },

  { code: "260111", name: "宜蘭羅東夜市門市", city: "宜蘭縣", addr: "宜蘭縣羅東鎮民權路100號" },
  { code: "262111", name: "礁溪溫泉門市", city: "宜蘭縣", addr: "宜蘭縣礁溪鄉中山路一段20號" },

  { code: "970111", name: "花蓮火車站門市", city: "花蓮縣", addr: "花蓮縣花蓮市國聯一路100號" },
  { code: "970222", name: "東大門夜市門市", city: "花蓮縣", addr: "花蓮縣花蓮市中山路50號" },

  { code: "950111", name: "台東鐵花村門市", city: "台東縣", addr: "台東縣台東市新生路135號" },
  { code: "954111", name: "知本溫泉門市", city: "台東縣", addr: "台東縣卑南鄉溫泉路200號" },

  { code: "880111", name: "馬公中正門市", city: "澎湖縣", addr: "澎湖縣馬公市中正路30號" },
  { code: "880222", name: "馬公觀音亭門市", city: "澎湖縣", addr: "澎湖縣馬公市西文里100號" },

  { code: "893111", name: "金城模範街門市", city: "金門縣", addr: "金門縣金城鎮模範街20號" },
  { code: "890222", name: "金沙陽宅門市", city: "金門縣", addr: "金門縣金沙鎮陽宅50號" },

  { code: "209111", name: "南竿介壽門市", city: "連江縣", addr: "連江縣南竿鄉介壽村100號" },
  { code: "210111", name: "北竿塘岐門市", city: "連江縣", addr: "連江縣北竿鄉塘岐村50號" },
];

function searchStores({ city, keyword }) {
  return STORE_DB.filter(s => {
    const matchCity = !city || s.city === city;
    const kw = (keyword || "").trim();
    const matchKeyword = !kw || s.name.includes(kw) || s.addr.includes(kw) || s.code.includes(kw);
    return matchCity && matchKeyword;
  });
}

// Search by 門市名稱 keyword only (ignores address/code) — matches the
// "門市名稱" tab on the official map.
function searchStoresByName(keyword) {
  const kw = (keyword || "").trim();
  if (!kw) return [];
  return STORE_DB.filter(s => s.name.includes(kw));
}

// Search by exact/partial 門市店號 — matches the "門市店號" tab.
function searchStoresByCode(codeQuery) {
  const q = (codeQuery || "").trim();
  if (!q) return [];
  return STORE_DB.filter(s => s.code.includes(q));
}

function findStoreByCode(code) {
  return STORE_DB.find(s => s.code === code);
}
