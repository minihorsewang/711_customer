// ---------------------------------------------------------------------
// 7-ELEVEN store dataset — real store names/addresses/codes, sampled
// (~8 per county/city) from a community-maintained open dataset of all
// Taiwan 7-ELEVEN stores (https://github.com/owenworktest/taiwan-7Eleven-store,
// 7,318 stores as of 2026-09-14). This is a snapshot, not a live feed —
// store codes can be reassigned and new stores open, so treat this as
// "real but potentially stale" data, not authoritative. A production
// build should still call the official lookup — e.g. ECPay/NewebPay's
// "Logistics Map" (超商電子地圖) API — for up-to-date, complete coverage.
// See README for integration notes.
// ---------------------------------------------------------------------

// Full list of Taiwan counties/cities, matching the layout of the real
// 7-ELEVEN electronic map's city grid.
const ALL_TAIWAN_CITIES = [
  "基隆市", "台北市", "新北市", "桃園市",
  "新竹市", "新竹縣", "苗栗縣", "台中市",
  "南投縣", "彰化縣", "嘉義市", "嘉義縣",
  "台南市", "高雄市", "屏東縣", "宜蘭縣",
  "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣",
];

const STORE_CITIES = [...ALL_TAIWAN_CITIES];

const STORE_DB = [
  { code: "286439", name: "碇內門市", city: "基隆市", addr: "基隆市暖暖區源遠路158號160號" },
  { code: "183284", name: "晨曦門市", city: "基隆市", addr: "基隆市暖暖區東勢街6之52號6之53號1樓" },
  { code: "138697", name: "新福樂門市", city: "基隆市", addr: "基隆市信義區深溪路43號45號1樓" },
  { code: "970738", name: "慶龍門市", city: "基隆市", addr: "基隆市仁愛區南榮路187號1樓" },
  { code: "249348", name: "崇信門市", city: "基隆市", addr: "基隆市信義區東信路212-4及214號1樓" },
  { code: "238278", name: "新壯觀門市", city: "基隆市", addr: "基隆市安樂區麥金路64號66號1樓" },
  { code: "235198", name: "新橫濱門市", city: "基隆市", addr: "基隆市中山區復興路209之3號1樓" },
  { code: "196279", name: "美的門市", city: "基隆市", addr: "基隆市信義區教孝街28號1樓" },
  { code: "283304", name: "公館門市", city: "台北市", addr: "台北市北投區公館路31號" },
  { code: "170130", name: "福氣門市", city: "台北市", addr: "台北市士林區延平北路六段122號124號1樓" },
  { code: "279235", name: "三興門市", city: "台北市", addr: "台北市信義區吳興街156巷2弄2號4號1樓" },
  { code: "283511", name: "雙環門市", city: "台北市", addr: "台北市萬華區環河南路二段207號" },
  { code: "951195", name: "榮鑫門市", city: "台北市", addr: "台北市中山區建國北路三段89號91號1樓" },
  { code: "264613", name: "榮總門市", city: "台北市", addr: "台北市北投區石牌路二段301號" },
  { code: "165183", name: "直安門市", city: "台北市", addr: "台北市中山區北安路649號" },
  { code: "269456", name: "德松門市", city: "台北市", addr: "台北市中山區德惠街200號1樓" },
  { code: "278335", name: "板橋中門市", city: "新北市", addr: "新北市板橋區中正路379巷3弄1號3號" },
  { code: "137591", name: "嘉添門市", city: "新北市", addr: "新北市三峽區嘉添路109-2號" },
  { code: "135768", name: "汐科門市", city: "新北市", addr: "新北市汐止區大同路二段167-1號1樓" },
  { code: "184184", name: "金裕門市", city: "新北市", addr: "新北市土城區裕民路255號1樓" },
  { code: "239134", name: "景鑽門市", city: "新北市", addr: "新北市中和區景新街373號373之1號" },
  { code: "241078", name: "金昂門市", city: "新北市", addr: "新北市淡水區新市一路一段99巷51.53號1樓" },
  { code: "287498", name: "新市鎮門市", city: "新北市", addr: "新北市淡水區新市一路三段18號1樓" },
  { code: "130615", name: "慶嶸門市", city: "新北市", addr: "新北市樹林區保安街一段323號323-1號1樓" },
  { code: "274621", name: "高正門市", city: "桃園市", addr: "桃園市中壢區中正路三段134號136號一樓" },
  { code: "196453", name: "冠興門市", city: "桃園市", addr: "桃園市觀音區成功路二段1247號" },
  { code: "293828", name: "廣城門市", city: "桃園市", addr: "桃園市平鎮區廣達里廣平街20號24號1樓" },
  { code: "284226", name: "富勝門市", city: "桃園市", addr: "桃園市龜山區文學路250號1樓" },
  { code: "289221", name: "民康門市", city: "桃園市", addr: "桃園市桃園區民族路150號1樓" },
  { code: "269489", name: "藝發門市", city: "桃園市", addr: "桃園市桃園區同安街340號342號1樓及同安街338巷1號1樓部分" },
  { code: "257040", name: "八德榮門市", city: "桃園市", addr: "桃園市八德區興豐路770號1樓" },
  { code: "202338", name: "新樺門市", city: "桃園市", addr: "桃園市新屋區中華南路一段379號381號" },
  { code: "264624", name: "科管門市", city: "新竹市", addr: "新竹市東區科園里新安路2之1號1樓" },
  { code: "286680", name: "盛天門市", city: "新竹市", addr: "新竹市北區延平路三段545號" },
  { code: "236157", name: "學圓門市", city: "新竹市", addr: "新竹市東區科學園路54號1樓" },
  { code: "113218", name: "華鑫門市", city: "新竹市", addr: "新竹市香山區五福路二段725、727、729號1樓" },
  { code: "188463", name: "新雅竹門市", city: "新竹市", addr: "新竹市北區湳雅街255號" },
  { code: "991067", name: "聯電E門市", city: "新竹市", addr: "新竹市東區力行路17號7樓" },
  { code: "259286", name: "竹清門市", city: "新竹市", addr: "新竹市北區中清路一段110號" },
  { code: "249821", name: "竹城門市", city: "新竹市", addr: "新竹市北區西門里中山路100號" },
  { code: "234209", name: "星都匯門市", city: "新竹縣", addr: "新竹縣竹東鎮光明路258號1樓旭光二路1號1樓" },
  { code: "188979", name: "東鑽門市", city: "新竹縣", addr: "新竹縣竹東鎮北興路三段517號519號" },
  { code: "212210", name: "仁順門市", city: "新竹縣", addr: "新竹縣湖口鄉仁和路130號132號134號" },
  { code: "863458", name: "醫湖門市", city: "新竹縣", addr: "新竹縣湖口鄉孝勢里忠孝路20號22號" },
  { code: "242347", name: "關功門市", city: "新竹縣", addr: "新竹縣關西鎮中山東路31號33號1樓" },
  { code: "161125", name: "園區門市", city: "新竹縣", addr: "新竹縣寶山鄉園區三路1號1樓" },
  { code: "154080", name: "積七門市", city: "新竹縣", addr: "新竹縣寶山鄉園區二路170號1樓" },
  { code: "251857", name: "六家門市", city: "新竹縣", addr: "新竹縣竹北市福興東路二段105號1樓" },
  { code: "167329", name: "新卓蘭門市", city: "苗栗縣", addr: "苗栗縣卓蘭鎮興南街318號" },
  { code: "255457", name: "大銅門市", city: "苗栗縣", addr: "苗栗縣銅鑼鄉銅鑼村中正路6之25號" },
  { code: "252469", name: "頭份門市", city: "苗栗縣", addr: "苗栗縣頭份市中正路232號" },
  { code: "921769", name: "通館門市", city: "苗栗縣", addr: "苗栗縣通霄鎮通西里中山路10號" },
  { code: "230414", name: "延平門市", city: "苗栗縣", addr: "苗栗縣竹南鎮照南里15鄰延平路63巷1號" },
  { code: "131353", name: "新和苑門市", city: "苗栗縣", addr: "苗栗縣苑裡鎮苑南里為公路4鄰16之1號1樓" },
  { code: "275657", name: "大南庄門市", city: "苗栗縣", addr: "苗栗縣南庄鄉南江村5鄰東江75-3號" },
  { code: "287801", name: "登雲門市", city: "苗栗縣", addr: "苗栗縣造橋鄉平仁路53-1號" },
  { code: "174877", name: "港臻門市", city: "台中市", addr: "台中市梧棲區文昌路333號" },
  { code: "241241", name: "新國光門市", city: "台中市", addr: "台中市南區國光路82及84號;愛國街67及69號" },
  { code: "147945", name: "理想門市", city: "台中市", addr: "台中市龍井區國際街155號157號159號1樓" },
  { code: "267427", name: "鑫親旺門市", city: "台中市", addr: "台中市大肚區沙田路二段195號199號" },
  { code: "229872", name: "大排門市", city: "台中市", addr: "台中市梧棲區中華路一段982號" },
  { code: "943851", name: "直興門市", city: "台中市", addr: "台中市豐原區水源路695號" },
  { code: "278483", name: "鹿成門市", city: "台中市", addr: "台中市沙鹿區光華路394.396號1樓" },
  { code: "277147", name: "長億門市", city: "台中市", addr: "台中市南區工學路108號" },
  { code: "993052", name: "埔佑門市", city: "南投縣", addr: "南投縣埔里鎮中華路116號1樓" },
  { code: "972804", name: "小瑞士門市", city: "南投縣", addr: "南投縣仁愛鄉定遠新村28號" },
  { code: "235338", name: "富聚門市", city: "南投縣", addr: "南投縣草屯鎮富寮里富中路373號" },
  { code: "275484", name: "鹿山門市", city: "南投縣", addr: "南投縣竹山鎮延祥里集山路三段73號、73-1號" },
  { code: "183332", name: "京鑫門市", city: "南投縣", addr: "南投縣草屯鎮中正路483號" },
  { code: "898351", name: "南崗門市", city: "南投縣", addr: "南投縣南投市民族路515號及南崗一路387號" },
  { code: "126351", name: "鑫永安門市", city: "南投縣", addr: "南投縣草屯鎮御史里登輝路558號" },
  { code: "121091", name: "愛蘭門市", city: "南投縣", addr: "南投縣埔里鎮鐵山路36號1樓" },
  { code: "237057", name: "金馬芯門市", city: "彰化縣", addr: "彰化縣彰化市茄苳路一段276號" },
  { code: "257109", name: "康詠門市", city: "彰化縣", addr: "彰化縣彰化市彰南路五段406.408.410號" },
  { code: "166555", name: "桂花門市", city: "彰化縣", addr: "彰化縣鹿港鎮鹿東路150號1+2樓" },
  { code: "239190", name: "火車頭門市", city: "彰化縣", addr: "彰化縣彰化市長樂里中正路一段536號538號" },
  { code: "183240", name: "員大門市", city: "彰化縣", addr: "彰化縣員林市員大路一段374號" },
  { code: "280752", name: "鹿鑫門市", city: "彰化縣", addr: "彰化縣鹿港鎮復興路289號291號293號" },
  { code: "255712", name: "海景門市", city: "彰化縣", addr: "彰化縣鹿港鎮東石里海浴路168號" },
  { code: "932194", name: "秀中門市", city: "彰化縣", addr: "彰化縣秀水鄉安東村中山路251號" },
  { code: "278416", name: "圓環門市", city: "嘉義市", addr: "嘉義市西區北杏里文化路155之2號1樓" },
  { code: "238441", name: "嘉西門市", city: "嘉義市", addr: "嘉義市西區大溪里北港路13鄰597號" },
  { code: "278427", name: "新瑞鴻門市", city: "嘉義市", addr: "嘉義市西區文化里民族路456號458號1樓" },
  { code: "276203", name: "四圍門市", city: "嘉義市", addr: "嘉義市西區福安里竹圍路190號" },
  { code: "252023", name: "新車店門市", city: "嘉義市", addr: "嘉義市西區福民里南京路462號1樓、2樓" },
  { code: "260781", name: "台林門市", city: "嘉義市", addr: "嘉義市東區新生路723號" },
  { code: "182742", name: "安捷門市", city: "嘉義市", addr: "嘉義市西區保安里保安一路301.303號1樓" },
  { code: "243775", name: "享溫心門市", city: "嘉義市", addr: "嘉義市西區中興路130號" },
  { code: "268567", name: "民雄福門市", city: "嘉義縣", addr: "嘉義縣民雄鄉福樂村新生一街21號" },
  { code: "882138", name: "興南門市", city: "嘉義縣", addr: "嘉義縣民雄鄉興南村15鄰頭橋557之43、557之45、557之46號1樓" },
  { code: "208657", name: "埔暉門市", city: "嘉義縣", addr: "嘉義縣中埔鄉和美村中山路五段450號" },
  { code: "170761", name: "灣橋門市", city: "嘉義縣", addr: "嘉義縣竹崎鄉灣橋村221號" },
  { code: "256885", name: "民雄十門市", city: "嘉義縣", addr: "嘉義縣民雄鄉大崎村十四甲16之148號" },
  { code: "240961", name: "中正大門市", city: "嘉義縣", addr: "嘉義縣民雄鄉三興村大學路一段421號" },
  { code: "210096", name: "栗子崙門市", city: "嘉義縣", addr: "嘉義縣東石鄉西崙村栗子崙191.193號" },
  { code: "284385", name: "朴站門市", city: "嘉義縣", addr: "嘉義縣朴子市平和路11-1號1樓" },
  { code: "967086", name: "二鎮門市", city: "台南市", addr: "台南市官田區二區里工社西街25巷81號" },
  { code: "231761", name: "府城市門市", city: "台南市", addr: "台南市安平區永華路二段6號1樓" },
  { code: "259275", name: "嘉北里門市", city: "台南市", addr: "台南市善化區嘉北里茄拔164號之7" },
  { code: "146252", name: "南瀛門市", city: "台南市", addr: "台南市永康區鹽行里中正路299號" },
  { code: "235095", name: "金武門市", city: "台南市", addr: "台南市新營區金華路一段262號" },
  { code: "132482", name: "七甲門市", city: "台南市", addr: "台南市六甲區六甲里中正路321之1號" },
  { code: "257361", name: "漁光門市", city: "台南市", addr: "台南市安平區國平里34鄰健康路三段355號" },
  { code: "279408", name: "耀瑩門市", city: "台南市", addr: "台南市北區公園路291號" },
  { code: "243616", name: "澄德門市", city: "高雄市", addr: "高雄市仁武區八卦里京吉六路67號1樓及69號1樓" },
  { code: "165275", name: "開封門市", city: "高雄市", addr: "高雄市大寮區大寮路688號" },
  { code: "233996", name: "應昇門市", city: "高雄市", addr: "高雄市三民區應昇路42號" },
  { code: "285768", name: "豐創門市", city: "高雄市", addr: "高雄市楠梓區創新路76號78號80號1樓" },
  { code: "990662", name: "興仁門市", city: "高雄市", addr: "高雄市鳳山區興仁里五甲一路204號206號1樓" },
  { code: "252872", name: "社旺門市", city: "高雄市", addr: "高雄市大社區大社路30-29號" },
  { code: "234287", name: "美都門市", city: "高雄市", addr: "高雄市三民區美都路98號" },
  { code: "913193", name: "正美門市", city: "高雄市", addr: "高雄市美濃區泰安里中正路一段21號23號" },
  { code: "268213", name: "墾丁門市", city: "屏東縣", addr: "屏東縣恆春鎮墾丁路60號62號" },
  { code: "257992", name: "學愛門市", city: "屏東縣", addr: "屏東縣麟洛鄉麟趾村中正路72之1號" },
  { code: "288882", name: "香社門市", city: "屏東縣", addr: "屏東縣萬丹鄉香社村香內路112號1樓" },
  { code: "264495", name: "學廣門市", city: "屏東縣", addr: "屏東縣內埔鄉內埔村廣濟路2-6號" },
  { code: "183561", name: "楓港門市", city: "屏東縣", addr: "屏東縣枋山鄉楓港村舊庄路21-3.21-4.21-5.21-6號1樓" },
  { code: "232742", name: "華僑門市", city: "屏東縣", addr: "屏東縣東港鎮朝隆路16-1號18號" },
  { code: "183077", name: "多多利門市", city: "屏東縣", addr: "屏東縣九如鄉九如路三段85號" },
  { code: "228765", name: "正莊門市", city: "屏東縣", addr: "屏東縣屏東市中正路766號" },
  { code: "993476", name: "潤昌門市", city: "宜蘭縣", addr: "宜蘭縣羅東鎮中山路四段197號199號" },
  { code: "249452", name: "金站門市", city: "宜蘭縣", addr: "宜蘭縣羅東鎮公正路31號1樓" },
  { code: "288767", name: "勝發門市", city: "宜蘭縣", addr: "宜蘭縣羅東鎮興東南路125號1樓" },
  { code: "283795", name: "佳美門市", city: "宜蘭縣", addr: "宜蘭縣五結鄉中正路二段127號1樓" },
  { code: "274425", name: "五興門市", city: "宜蘭縣", addr: "宜蘭縣五結鄉五結路三段258號" },
  { code: "234829", name: "龍坡門市", city: "宜蘭縣", addr: "宜蘭縣宜蘭市大坡路一段111號113號" },
  { code: "200181", name: "易安門市", city: "宜蘭縣", addr: "宜蘭縣五結鄉五結中路二段377號379號1樓" },
  { code: "951564", name: "壯圍門市", city: "宜蘭縣", addr: "宜蘭縣壯圍鄉壯五路143之3號" },
  { code: "260699", name: "富泰門市", city: "花蓮縣", addr: "花蓮縣花蓮市國聯一路55號" },
  { code: "151276", name: "蓮恆門市", city: "花蓮縣", addr: "花蓮縣吉安鄉北昌村建國路一段49號51號" },
  { code: "891420", name: "慈濟門市", city: "花蓮縣", addr: "花蓮縣花蓮市中央路三段808號810號" },
  { code: "116413", name: "興玉門市", city: "花蓮縣", addr: "花蓮縣玉里鎮興國路二段23號" },
  { code: "959177", name: "如意門市", city: "花蓮縣", addr: "花蓮縣花蓮市中美路37號" },
  { code: "153375", name: "玉里門市", city: "花蓮縣", addr: "花蓮縣玉里鎮中山路二段90號1樓" },
  { code: "174305", name: "樂合門市", city: "花蓮縣", addr: "花蓮縣玉里鎮樂合里新民路13-1號" },
  { code: "284123", name: "蓮富門市", city: "花蓮縣", addr: "花蓮縣光復鄉中正路一段90號1樓中山路二段250號252號1樓" },
  { code: "180702", name: "東安門市", city: "台東縣", addr: "台東縣台東市杭州街288號1樓" },
  { code: "280707", name: "吉川門市", city: "台東縣", addr: "台東縣台東市中華路二段272號1樓274號1樓2樓276號1樓" },
  { code: "142892", name: "蘭嶼門市", city: "台東縣", addr: "台東縣蘭嶼鄉椰油村椰油296之12號" },
  { code: "258445", name: "東廣門市", city: "台東縣", addr: "台東縣台東市傳廣路492號1樓" },
  { code: "258102", name: "鉦祺門市", city: "台東縣", addr: "台東縣台東市中興路一段279號" },
  { code: "872599", name: "東航門市", city: "台東縣", addr: "台東縣台東市民生里更生路270號1F" },
  { code: "954574", name: "東樂門市", city: "台東縣", addr: "台東縣台東市山西路一段330號" },
  { code: "232100", name: "初來門市", city: "台東縣", addr: "台東縣海端鄉海端村初來11之1號" },
  { code: "941202", name: "澎技門市", city: "澎湖縣", addr: "澎湖縣馬公市朝陽里三多路45號" },
  { code: "113506", name: "揚光門市", city: "澎湖縣", addr: "澎湖縣馬公市陽明里中華路175號1樓" },
  { code: "181750", name: "馬航門市", city: "澎湖縣", addr: "澎湖縣湖西鄉隘門村126之5號1樓(馬公航空站一樓航廈)" },
  { code: "930545", name: "新台澎門市", city: "澎湖縣", addr: "澎湖縣馬公市中正路85號" },
  { code: "232649", name: "望安門市", city: "澎湖縣", addr: "澎湖縣望安鄉東安村89號" },
  { code: "262064", name: "澎港門市", city: "澎湖縣", addr: "澎湖縣馬公市鎖港里292號1樓" },
  { code: "941833", name: "井垵門市", city: "澎湖縣", addr: "澎湖縣馬公市井垵里1-18號" },
  { code: "233583", name: "澎樂門市", city: "澎湖縣", addr: "澎湖縣馬公市珠江110-22號1樓、110-30號1、2樓" },
  { code: "255055", name: "金生門市", city: "金門縣", addr: "金門縣金城鎮西門里民生路67.69號" },
  { code: "236331", name: "金民門市", city: "金門縣", addr: "金門縣金城鎮民生路9號1樓" },
  { code: "263078", name: "新再發門市", city: "金門縣", addr: "金門縣金湖鎮復興路8號10號" },
  { code: "183871", name: "中蘭門市", city: "金門縣", addr: "金門縣金沙鎮環島北路三段482號" },
  { code: "242288", name: "金冠門市", city: "金門縣", addr: "金門縣金湖鎮環島南路四段560號562號566號" },
  { code: "277181", name: "金門大門市", city: "金門縣", addr: "金門縣金寧鄉大學路1號1樓" },
  { code: "970820", name: "金寧門市", city: "金門縣", addr: "金門縣金寧鄉環島北路一段711號" },
  { code: "292881", name: "金門醫門市", city: "金門縣", addr: "金門縣金湖鎮復興路2-1號1樓" },
  { code: "194055", name: "福澳港門市", city: "連江縣", addr: "連江縣南竿鄉福澳村129號" },
  { code: "250223", name: "坪里門市", city: "連江縣", addr: "連江縣北竿鄉坪里村42號1樓" },
  { code: "950376", name: "南竿門市", city: "連江縣", addr: "連江縣南竿鄉清水村100號" },
  { code: "209029", name: "東莒門市", city: "連江縣", addr: "連江縣莒光鄉大坪村27號" },
  { code: "952523", name: "北竿門市", city: "連江縣", addr: "連江縣北竿鄉塘岐村中山路191號193號195號" },
  { code: "206617", name: "山隴門市", city: "連江縣", addr: "連江縣南竿鄉介壽村232號233號284號" },
  { code: "262824", name: "馬祖門市", city: "連江縣", addr: "連江縣南竿鄉介壽村215號1樓" },
  { code: "188957", name: "東引門市", city: "連江縣", addr: "連江縣東引鄉中柳村85與86號1樓" },
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
