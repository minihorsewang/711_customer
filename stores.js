// ---------------------------------------------------------------------
// Demo 7-ELEVEN store dataset (mock data for prototype only).
// Real implementation should call the official 7-11 store lookup —
// e.g. ECPay/NewebPay "Logistics Map" (超商電子地圖) API, which returns
// the live CVSStoreID / CVSStoreName / CVSAddress after the seller
// picks a store on the official map. See README for integration notes.
// ---------------------------------------------------------------------

const STORE_CITIES = ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市"];

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
];

function searchStores({ city, keyword }) {
  return STORE_DB.filter(s => {
    const matchCity = !city || s.city === city;
    const kw = (keyword || "").trim();
    const matchKeyword = !kw || s.name.includes(kw) || s.addr.includes(kw) || s.code.includes(kw);
    return matchCity && matchKeyword;
  });
}

function findStoreByCode(code) {
  return STORE_DB.find(s => s.code === code);
}
