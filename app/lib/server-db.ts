import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'game.db');
let db: Database.Database | null = null;

export function getDB() {
  if (!db) {
    db = initDB();
  }
  return db;
}

// 为服务器端API提供别名
export const getServerDB = getDB;

function initDB() {
  const database = new Database(dbPath);

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      coins INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS fish (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      name_en TEXT,
      stars INTEGER DEFAULT 1,
      sell_price INTEGER DEFAULT 10,
      image_url TEXT,
      emoji TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS catch_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      fish_id INTEGER,
      sold BOOLEAN DEFAULT 0,
      caught_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (fish_id) REFERENCES fish(id)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS daily_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      check_in_date DATE NOT NULL,
      coins_earned INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, check_in_date)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS game_stats (
      user_id INTEGER PRIMARY KEY,
      energy INTEGER DEFAULT 5,
      max_energy INTEGER DEFAULT 5,
      last_energy_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      daily_play_seconds INTEGER DEFAULT 0,
      daily_limit_seconds INTEGER DEFAULT 1800,
      last_reset_date DATE DEFAULT (DATE('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      game TEXT,
      best_score INTEGER DEFAULT 0,
      last_score INTEGER DEFAULT 0,
      last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_bonus_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, game),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS cinema_unlocks (
      user_id INTEGER,
      anime_id TEXT,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, anime_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      user_id INTEGER,
      book_id TEXT,
      chapter_id TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, book_id, chapter_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS farm_crops (
      id TEXT PRIMARY KEY,
      user_id INTEGER DEFAULT 1,
      type TEXT NOT NULL,
      planted_at INTEGER NOT NULL,
      watered_at INTEGER,
      growth_time INTEGER NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      status TEXT DEFAULT 'growing',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS farm_animals (
      id TEXT PRIMARY KEY,
      user_id INTEGER DEFAULT 1,
      type TEXT NOT NULL,
      bought_at INTEGER NOT NULL,
      production_time INTEGER NOT NULL,
      last_produced_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Farm inventory - stores harvested crops
  database.exec(`
    CREATE TABLE IF NOT EXISTS farm_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      crop_type TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      UNIQUE(user_id, crop_type),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Farm collection - tracks which crops have ever been harvested (for 图鉴)
  database.exec(`
    CREATE TABLE IF NOT EXISTS farm_collection (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      crop_type TEXT NOT NULL,
      first_harvested_at INTEGER NOT NULL,
      UNIQUE(user_id, crop_type),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Initialize default settings
  database.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value) VALUES ('cinema_ticket_price', '50')
  `).run();

  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    database.prepare('INSERT INTO users (username, password, coins) VALUES (?, ?, ?)').run('test', '123456', 1000);
  }

  // 使用从HelloDive网站抓取的真实鱼类数据（71种）
  const fishData = [
    // 1星 - 小型常见鱼类 (14种)
    { name: '小丑鱼', name_en: 'Amphiprioninae', stars: 1, sell_price: 5, image: 'https://www.hellodive.com/uploads/image/2016/0825/20160825005922_9104.jpg', emoji: '🐠', desc: '《海底总动员》里的尼莫' },
    { name: '虾虎鱼', name_en: 'Prawn goby', stars: 1, sell_price: 6, image: 'https://www.hellodive.com/uploads/image/2017/1029/20171029225835_7801.jpg', emoji: '🐟', desc: '生活在海底的小型鱼类，常与虾共生' },
    { name: '蝶鱼', name_en: 'Butterflyfish', stars: 1, sell_price: 7, image: 'https://www.hellodive.com/uploads/image/2018/0203/20180203222028_4301.jpg', emoji: '🐠', desc: '色彩艳丽的珊瑚礁鱼类，成对出现' },
    { name: '笛鲷', name_en: 'Five Lined Snapper', stars: 1, sell_price: 8, image: 'https://www.hellodive.com/uploads/image/2018/0113/20180113001623_2229.jpg', emoji: '🐟', desc: '常见的热带鱼类，身上有五条纵线' },
    { name: '比目鱼', name_en: 'Founder', stars: 1, sell_price: 7, image: 'https://www.hellodive.com/uploads/image/2017/0309/20170309164822_7581.jpg', emoji: '🐟', desc: '身体扁平，两眼同侧的奇特鱼类' },
    { name: '飞鱼', name_en: 'Flying fish', stars: 1, sell_price: 9, image: 'https://www.hellodive.com/uploads/image/2017/0309/20170309165102_6720.jpg', emoji: '🐟', desc: '能飞跃出水面的神奇鱼类' },
    { name: '喇叭鱼', name_en: 'Trumpet fish', stars: 1, sell_price: 8, image: 'https://www.hellodive.com/uploads/image/2017/0705/20170705140110_5112.jpg', emoji: '🎺', desc: '身体细长如喇叭的鱼类' },
    { name: '豆丁海马', name_en: 'Pygmy seahorse', stars: 1, sell_price: 10, image: 'https://www.hellodive.com/uploads/image/2016/1120/20161120144705_8068.jpg', emoji: '🐴', desc: '世界上最小的海马之一' },
    { name: '沙丁鱼', name_en: 'Sardine', stars: 1, sell_price: 5, image: 'https://www.hellodive.com/uploads/image/2016/0911/20160911230228_1801.jpg', emoji: '🐟', desc: '大群游动的小型鱼类' },
    { name: '刺豚', name_en: 'Puffer', stars: 1, sell_price: 9, image: 'https://www.hellodive.com/uploads/image/2017/0309/20170309164724_7111.jpg', emoji: '🐡', desc: '会鼓成圆球的河豚科鱼类' },
    { name: '小丑扳机鱼', name_en: 'Clown Triggerfish', stars: 1, sell_price: 10, image: 'https://www.hellodive.com/uploads/image/2016/0924/20160924005553_6873.jpg', emoji: '🐠', desc: '色彩斑斓的扳机鱼' },
    { name: '海胆', name_en: 'Sea urchin', stars: 1, sell_price: 6, image: 'https://www.hellodive.com/uploads/image/2016/0924/20160924005719_9574.jpg', emoji: '🦔', desc: '浑身尖刺的球形生物' },
    { name: '蓝指海星', name_en: 'Linckia Sea Star,Blue', stars: 1, sell_price: 7, image: 'https://www.hellodive.com/uploads/image/2016/0906/20160906002511_9748.jpg', emoji: '⭐', desc: '鲜艳的蓝色海星' },
    { name: '粒皮瘤海星', name_en: 'Granulated Seastar', stars: 1, sell_price: 8, image: 'https://www.hellodive.com/uploads/image/2017/1116/20171116133523_7320.jpg', emoji: '⭐', desc: '表面有颗粒状突起的海星' },

    // 2星 - 中型鱼类和珊瑚 (17种)
    { name: '石斑鱼', name_en: 'Grouper', stars: 2, sell_price: 12, image: 'https://www.hellodive.com/uploads/image/2017/1026/20171026232950_2529.jpg', emoji: '🐟', desc: '礁石中的捕食高手，体型硕大' },
    { name: '躄鱼', name_en: 'Frogfishes', stars: 2, sell_price: 13, image: 'https://www.hellodive.com/uploads/2019/20190324/111f87179a9db7135533b63974fd8452.jpg', emoji: '🐸', desc: '外形像青蛙的伪装高手' },
    { name: '隆头鹦嘴鱼', name_en: 'Humphead Parrotfish', stars: 2, sell_price: 14, image: 'https://www.hellodive.com/uploads/image/2016/0911/20160911225815_4017.jpg', emoji: '🐟', desc: '色彩鲜艳的鹦嘴鱼' },
    { name: '狮子鱼', name_en: 'Lionfish', stars: 2, sell_price: 15, image: 'https://www.hellodive.com/uploads/image/2016/0906/20160906002713_7560.jpg', emoji: '🦁', desc: '美丽但有毒的鱼类' },
    { name: '海鳝', name_en: 'Leopard moray eel', stars: 2, sell_price: 14, image: 'https://www.hellodive.com/uploads/image/2017/0503/20170503231552_7044.jpg', emoji: '🐍', desc: '躲藏在礁石缝隙中的长身鱼类' },
    { name: '石头鱼', name_en: 'Stone fish', stars: 2, sell_price: 16, image: 'https://www.hellodive.com/uploads/image/2016/0924/20160924010018_1914.jpg', emoji: '🪨', desc: '世界上最毒的鱼之一，善于伪装' },
    { name: '泡泡虾', name_en: 'Bubble Coral Shrimp', stars: 2, sell_price: 13, image: 'https://www.hellodive.com/uploads/image/2017/1029/20171029230159_5685.jpg', emoji: '🦐', desc: '栖息在泡泡珊瑚中的小虾' },
    { name: '龟足', name_en: 'Goose Barnacle', stars: 2, sell_price: 15, image: 'https://www.hellodive.com/uploads/image/2017/1023/20171023160632_7432.jpg', emoji: '🦪', desc: '珍贵的附着生物，美食佳品' },
    { name: '海葵', name_en: 'Sea anemones', stars: 2, sell_price: 12, image: 'https://www.hellodive.com/uploads/image/2017/1106/20171106155844_1086.jpg', emoji: '🪸', desc: '触手有毒的固着生物，小丑鱼的家' },
    { name: '皮革珊瑚', name_en: 'Toadstool Leather Coral', stars: 2, sell_price: 14, image: 'https://www.hellodive.com/uploads/image/2017/1029/20171029230016_4063.jpg', emoji: '🍄', desc: '质地像皮革的软珊瑚' },
    { name: '猫眼珊瑚', name_en: 'Knob coral', stars: 2, sell_price: 13, image: 'https://www.hellodive.com/uploads/image/2017/1022/20171022233059_2401.jpg', emoji: '👁️', desc: '表面有凸起似猫眼的珊瑚' },
    { name: '气泡珊瑚', name_en: 'Bubble Coral', stars: 2, sell_price: 12, image: 'https://www.hellodive.com/uploads/image/2017/0206/20170206114732_5517.jpg', emoji: '🫧', desc: '像气泡一样的珊瑚' },
    { name: '宝石花珊瑚', name_en: 'Flower Pot Coral', stars: 2, sell_price: 15, image: 'https://www.hellodive.com/uploads/image/2016/0824/20160824010521_6659.jpg', emoji: '💎', desc: '如宝石般闪耀的珊瑚' },
    { name: '脑珊瑚', name_en: 'Trachyphyllia geofroyi', stars: 2, sell_price: 14, image: 'https://www.hellodive.com/uploads/image/2016/0824/20160824010809_8655.jpg', emoji: '🧠', desc: '表面像大脑纹路的珊瑚' },
    { name: '鸡冠珊瑚', name_en: 'Carnation Tree Coral', stars: 2, sell_price: 16, image: 'https://www.hellodive.com/uploads/image/2016/0824/20160824010941_7400.jpg', emoji: '🌸', desc: '形似鸡冠的美丽珊瑚' },
    { name: '红海树珊瑚', name_en: 'Subergorgia suberosa', stars: 2, sell_price: 15, image: 'https://www.hellodive.com/uploads/image/2016/0824/20160824011113_5250.jpg', emoji: '🌳', desc: '红海特有的树状珊瑚' },
    { name: '圣诞树蠕虫', name_en: 'Christmas Tree Worms', stars: 2, sell_price: 13, image: 'https://www.hellodive.com/uploads/image/2017/0206/20170206114923_5059.jpg', emoji: '🎄', desc: '像圣诞树一样的管虫' },

    // 3星 - 大型鱼类和特殊生物 (18种)
    { name: '叶海龙', name_en: 'Leafy seadragons', stars: 3, sell_price: 20, image: 'https://www.hellodive.com/uploads/image/2017/1106/20171106160009_3768.jpg', emoji: '🌿', desc: '拥有叶片状附肢的奇特海马' },
    { name: '西班牙舞娘', name_en: 'Spanish Dancer', stars: 3, sell_price: 22, image: 'https://www.hellodive.com/uploads/image/2017/1107/20171107180125_2731.jpg', emoji: '💃', desc: '色彩艳丽的裸鳃类，游动如舞蹈' },
    { name: '史努比海蛞蝓', name_en: 'Jorunna funebris', stars: 3, sell_price: 21, image: 'https://www.hellodive.com/uploads/image/2017/1212/20171212003328_3768.jpg', emoji: '🐰', desc: '像史努比一样可爱的海蛞蝓' },
    { name: '海百合', name_en: 'Crinoidea', stars: 3, sell_price: 19, image: 'https://www.hellodive.com/uploads/image/2017/1021/20171021232254_4092.jpg', emoji: '🌺', desc: '像花朵一样美丽的棘皮动物' },
    { name: '千手佛珊瑚', name_en: 'Tube-dwelling anemone', stars: 3, sell_price: 20, image: 'https://www.hellodive.com/uploads/image/2017/1029/20171029230229_3566.jpg', emoji: '🪸', desc: '拥有众多触手的珊瑚' },
    { name: '棘冠海星', name_en: 'Crown of thorns Sea Star', stars: 3, sell_price: 18, image: 'https://www.hellodive.com/uploads/image/2016/0906/20160906002614_5372.jpg', emoji: '👑', desc: '带有毒刺的大型海星' },
    { name: '海蛇', name_en: 'Sea Snake', stars: 3, sell_price: 23, image: 'https://www.hellodive.com/uploads/image/2017/0705/20170705135919_6855.jpg', emoji: '🐍', desc: '剧毒的海洋爬行动物' },
    { name: '蓝环章鱼', name_en: 'The blue Ringed Octopus', stars: 3, sell_price: 25, image: 'https://www.hellodive.com/uploads/image/2017/0609/20170609005558_6463.jpg', emoji: '🐙', desc: '体型小但剧毒的章鱼' },
    { name: '章鱼', name_en: 'Octopus', stars: 3, sell_price: 20, image: 'https://www.hellodive.com/uploads/image/2017/0107/20170107162528_3234.jpg', emoji: '🐙', desc: '聪明的八爪生物' },
    { name: '伞膜乌贼', name_en: 'Giant Cuttlefish', stars: 3, sell_price: 22, image: 'https://www.hellodive.com/uploads/image/2016/1118/20161118012011_4854.jpg', emoji: '🦑', desc: '世界上最大的乌贼之一' },
    { name: '钵水母', name_en: 'Jellyfish', stars: 3, sell_price: 18, image: 'https://www.hellodive.com/uploads/image/2016/0829/20160829005604_6864.jpg', emoji: '🪼', desc: '透明漂浮的海洋精灵' },
    { name: '玳瑁', name_en: 'Hawksbill sea turtle', stars: 3, sell_price: 24, image: 'https://www.hellodive.com/uploads/image/2016/0829/20160829011244_4023.jpg', emoji: '🐢', desc: '珍稀的海龟品种' },
    { name: '鳐鱼', name_en: 'Ray', stars: 3, sell_price: 21, image: 'https://www.hellodive.com/uploads/image/2016/0906/20160906002230_7708.jpg', emoji: '🐟', desc: '扁平的软骨鱼类' },
    { name: '刺魟', name_en: 'Red stingray', stars: 3, sell_price: 22, image: 'https://www.hellodive.com/uploads/image/2016/1211/20161211205722_2136.jpg', emoji: '⚡', desc: '尾部有毒刺的鳐鱼' },
    { name: '梭鱼', name_en: 'Barracuda', stars: 3, sell_price: 23, image: 'https://www.hellodive.com/uploads/image/2017/0324/20170324135715_1354.jpg', emoji: '🐟', desc: '游速极快的掠食鱼类' },
    { name: '曲纹唇鱼', name_en: 'Double-headed maori wrasse', stars: 3, sell_price: 25, image: 'https://www.hellodive.com/uploads/image/2016/1108/20161108004517_1953.jpg', emoji: '🐟', desc: '大型礁石鱼类，性格温和' },
    { name: '海豚', name_en: 'Dolphins', stars: 3, sell_price: 26, image: 'https://www.hellodive.com/uploads/image/2016/0924/20160924005243_3744.jpg', emoji: '🐬', desc: '最聪明的海洋哺乳动物' },
    { name: '海狗', name_en: 'Fur seals', stars: 3, sell_price: 24, image: 'https://www.hellodive.com/uploads/2018/20180708/8a3382710a441e0d3611a52f694154bf.jpg', emoji: '🦭', desc: '可爱的海洋哺乳动物，喜欢群居' },

    // 4星 - 大型鲨鱼和稀有生物 (12种)
    { name: '护士鲨', name_en: 'Nurse Shark', stars: 4, sell_price: 35, image: 'https://www.hellodive.com/uploads/image/2016/0823/20160823013113_9826.jpg', emoji: '🦈', desc: '温和的底栖鲨鱼' },
    { name: '须鲨', name_en: 'Carpet Shark', stars: 4, sell_price: 40, image: 'https://www.hellodive.com/uploads/image/2017/0815/20170815161923_5760.jpg', emoji: '🦈', desc: '底栖的神秘鲨鱼，喜欢伪装' },
    { name: '白鳍鲨', name_en: 'Whitetip shark', stars: 4, sell_price: 38, image: 'https://www.hellodive.com/uploads/image/2016/0911/20160911230006_2959.jpg', emoji: '🦈', desc: '礁鲨中的常见品种' },
    { name: '牛鲨', name_en: 'Bull shark', stars: 4, sell_price: 42, image: 'https://www.hellodive.com/uploads/image/2018/0113/20180113001414_3670.jpg', emoji: '🦈', desc: '强壮的捕食者，能适应淡水环境' },
    { name: '长尾鲨', name_en: 'Thresher Shark', stars: 4, sell_price: 45, image: 'https://www.hellodive.com/uploads/image/2016/0917/20160917232628_1403.jpg', emoji: '🦈', desc: '拥有超长尾鳍的鲨鱼' },
    { name: '旗鱼', name_en: 'Sail fish', stars: 4, sell_price: 40, image: 'https://www.hellodive.com/uploads/image/2017/0309/20170309164955_2857.jpg', emoji: '⛵', desc: '海洋中速度最快的鱼类' },
    { name: '翻车鱼', name_en: 'Mola mola', stars: 4, sell_price: 50, image: 'https://www.hellodive.com/uploads/image/2016/0830/20160830003713_4522.jpg', emoji: '🌞', desc: '奇特的圆形大鱼' },
    { name: '安康鱼', name_en: 'Anglerfish', stars: 4, sell_price: 38, image: 'https://www.hellodive.com/uploads/image/2016/1211/20161211205553_5822.jpg', emoji: '💡', desc: '深海中的发光捕食者' },
    { name: '鹦鹉螺', name_en: 'Nautilus', stars: 4, sell_price: 48, image: 'https://www.hellodive.com/uploads/image/2017/0806/20170806172037_3136.jpg', emoji: '🐚', desc: '活化石，拥有精美的螺旋壳' },
    { name: '大砗磲', name_en: 'Tridacna', stars: 4, sell_price: 45, image: 'https://www.hellodive.com/uploads/image/2017/0605/20170605131301_6717.jpg', emoji: '🦪', desc: '世界上最大的双壳贝类' },
    { name: '海牛', name_en: 'Manatee、Sea Cows', stars: 4, sell_price: 46, image: 'https://www.hellodive.com/uploads/image/2017/0107/20170107162312_7348.jpg', emoji: '🦛', desc: '温和的水中巨兽' },
    { name: '小须鲸', name_en: 'Minke whale', stars: 4, sell_price: 55, image: 'https://www.hellodive.com/uploads/2019/20191031/1b8e45458fcf7e483d9827ad11431f39.jpg', emoji: '🐋', desc: '体型较小的须鲸，喜欢浅海' },

    // 5星 - 巨型传说生物 (10种)
    { name: '鲸鲨', name_en: 'Whale shark', stars: 5, sell_price: 120, image: 'https://www.hellodive.com/uploads/image/2016/0823/20160823005332_5948.jpg', emoji: '🦈', desc: '世界上最大的鱼类，性情温和' },
    { name: '大白鲨', name_en: 'Great white shark', stars: 5, sell_price: 110, image: 'https://www.hellodive.com/uploads/image/2017/0806/20170806172453_8180.jpg', emoji: '🦈', desc: '终极海洋掠食者，海洋霸主' },
    { name: '双髻鲨', name_en: 'Hammerhead Shark', stars: 5, sell_price: 100, image: 'https://www.hellodive.com/uploads/image/2018/0209/20180209135353_2539.jpg', emoji: '🔨', desc: '独特头部的鲨鱼之王' },
    { name: '巨口鲨', name_en: 'Megamouth Shark', stars: 5, sell_price: 105, image: 'https://www.hellodive.com/uploads/image/2017/0727/20170727154437_3876.jpg', emoji: '👄', desc: '极为罕见的深海大嘴鲨鱼' },
    { name: '领航鲸', name_en: 'Pilot whale', stars: 5, sell_price: 95, image: 'https://www.hellodive.com/uploads/image/2018/0203/20180203221917_1684.jpg', emoji: '🐋', desc: '海洋中的智慧生物，群居性强' },
    { name: '大翅鲸', name_en: 'Humpback whale', stars: 5, sell_price: 115, image: 'https://www.hellodive.com/uploads/image/2016/0911/20160911225438_5173.jpg', emoji: '🐋', desc: '会唱歌的巨型鲸鱼，喜欢跃出水面' },
    { name: '蓝鲸', name_en: 'Blue Whale', stars: 5, sell_price: 150, image: 'https://www.hellodive.com/uploads/image/2016/0911/20160911225621_4233.jpg', emoji: '🐋', desc: '地球上最大的动物' },
    { name: '抹香鲸', name_en: 'Sperm whale', stars: 5, sell_price: 130, image: 'https://www.hellodive.com/uploads/image/2017/0609/20170609005455_4074.jpg', emoji: '🐋', desc: '潜水最深的鲸类' },
    { name: '虎鲸', name_en: 'Killer Whale', stars: 5, sell_price: 140, image: 'https://www.hellodive.com/uploads/image/2017/0107/20170107163824_9397.jpg', emoji: '🐋', desc: '海洋中的顶级掠食者' },
    { name: '双吻前口蝠鲼', name_en: 'Giant oceanic manta ray', stars: 5, sell_price: 125, image: 'https://www.hellodive.com/uploads/image/2016/0829/20160829011532_9317.jpg', emoji: '🦑', desc: '优雅的海底飞行巨兽' }
  ];

  const upsertFish = database.prepare(`
    INSERT INTO fish(name, name_en, stars, sell_price, image_url, emoji, description)
    VALUES(@name, @name_en, @stars, @sell_price, @image, @emoji, @desc)
    ON CONFLICT(name) DO UPDATE SET
      name_en = @name_en,
    stars = @stars,
    sell_price = @sell_price,
    image_url = @image,
    emoji = @emoji,
    description = @desc
      `);

  const updateFishTx = database.transaction((fishes) => {
    for (const fish of fishes) upsertFish.run(fish);
  });

  updateFishTx(fishData);

  return database;
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
