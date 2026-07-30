export const store = {
  name: "ตำปูม้าคาเฟ่",
  descriptor: "FOOD · COFFEE · RIVER · MUSIC",
  address: "เสาธงเก่า หมู่ 2",
  phoneDisplay: "092 535 3909",
  phoneHref: "tel:0925353909",
  facebook: "https://www.facebook.com/profile.php?id=100089601703253",
  maps:
    "https://www.google.com/maps/search/?api=1&query=ตำปูม้าคาเฟ่+เสาธงเก่า",
  services: ["รับประทานที่ร้าน", "ซื้อกลับบ้าน", "ที่นั่งกลางแจ้ง"],
  socialProof: {
    recommended: "98%",
    reviews: "38",
    followers: "5.9K",
  },
  sampleHours: "10:00–22:00 น.",
} as const;

export const menuItems = [
  {
    title: "ตำปูม้า",
    description: "ปูม้าสด เนื้อหวาน คลุกน้ำปลาร้ารสนัว ครบรสแบบอีสาน",
    categories: ["signature", "seafood"],
    badges: ["แนะนำ", "เผ็ด"],
    slot: "รูปตำปูม้าระยะใกล้",
    image: "/images/tam-pu-ma.jpg",
  },
  {
    title: "ปูม้านึ่ง",
    description: "ปูม้าสดนึ่งพอดี เสิร์ฟพร้อมน้ำจิ้มซีฟู้ดรสจัดจ้าน",
    categories: ["seafood"],
    badges: ["ขายดี", "อาหารทะเล"],
    slot: "รูปปูม้านึ่ง",
    image: null,
  },
  {
    title: "อาหารทะเลสด",
    description: "วัตถุดิบสดจากทะเล ปรุงตามสไตล์ของร้าน",
    categories: ["seafood"],
    badges: ["สดทุกวัน"],
    slot: "รูปอาหารทะเลสด",
    image: null,
  },
  {
    title: "เมนูยำ",
    description: "เครื่องแน่น รสแซ่บ เปรี้ยว เค็ม หวาน ลงตัว",
    categories: ["signature"],
    badges: ["แนะนำ", "เผ็ด"],
    slot: "รูปเมนูยำ",
    image: "/images/tam-luang-prabang.png",
  },
  {
    title: "กาแฟและเครื่องดื่ม",
    description: "สดชื่นระหว่างวัน จิบเพลินไปกับบรรยากาศริมน้ำ",
    categories: ["drinks"],
    badges: ["คาเฟ่"],
    slot: "รูปกาแฟหรือเครื่องดื่ม",
    image: null,
  },
  {
    title: "ของหวาน",
    description: "ปิดท้ายมื้ออร่อยด้วยของหวานและความสดชื่น",
    categories: ["drinks"],
    badges: ["ของหวาน"],
    slot: "รูปของหวาน",
    image: null,
  },
] as const;

export const galleryItems = [
  {
    caption: "บรรยากาศริมน้ำของร้าน",
    src: "/images/hero-restaurant.jpg",
  },
  {
    caption: "โต๊ะอาหารกลางแจ้ง",
    src: "/images/restaurant-flags.jpg",
  },
  {
    caption: "ดนตรีสดช่วงค่ำ",
    src: "/images/music-live.jpg",
  },
  {
    caption: "ตำปูม้าจานเด่นของร้าน",
    src: "/images/tam-pu-ma.jpg",
  },
  {
    caption: "มุม Coffee Bar",
    src: "/images/coffee-bar.jpg",
  },
  {
    caption: "วิวสายน้ำข้างร้าน",
    src: "/images/river-view.jpg",
  },
  {
    caption: "ลูกค้าและบรรยากาศช่วงค่ำ",
    src: "/images/restaurant-night.jpg",
  },
] as const;

export const sampleReviews = [
  "พื้นที่สำหรับรีวิวจริงของลูกค้า ความยาวประมาณ 2–3 บรรทัดจะแสดงผลสวยที่สุด",
  "ข้อความรีวิวตัวอย่างสำหรับจัดหน้าเว็บไซต์ รอคัดรีวิวจริงจากเพจของร้านมาแทน",
  "บรรยากาศริมน้ำ อาหารรสจัดจ้าน และมีมุมสบายสำหรับทุกคนในครอบครัว",
  "พื้นที่รีวิวตัวอย่าง เจ้าของร้านสามารถเปลี่ยนเป็นรีวิวจริงพร้อมชื่อผู้รีวิวได้ภายหลัง",
  "ตัวอย่างข้อความรีวิว ใช้ทดสอบการจัดวางบนมือถือและเดสก์ท็อป",
] as const;
