# MVP Boss Timer (Tomb Tracker) v1.0

เว็บไซต์จดเวลาตายบอสจาก Tomb แล้วคำนวณ **เวลาเกิดคาดการณ์ = เวลาตาย + 2 ชั่วโมง** เรียงบอสที่กำลังรอเกิดก่อนและแสดงเฉพาะคู่บอส/แมพที่มีผู้บันทึกข้อมูล พร้อมนับถอยหลังแบบวินาที

- เลือกชื่อ MVP จาก RateMyServer (Pre-Renewal) **50 บอส / 63 คู่บอส–แมพ**
- บอสที่มีหลายแมพแยกการบันทึก/คำนวณรายแมพ เช่น Atroce, Maya, Eddga
- เลือกวันที่และเวลาตายจาก Tomb โดยใช้ **เวลาไทย UTC+7**; กด "เมื่อวาน" เมื่อ Tomb อยู่วันก่อนหน้า
- บันทึก / แก้ไข / ลบได้ ไม่ต้องใช้บัญชีหรือรหัสผ่าน
- ซิงก์ข้อมูลร่วมกันอัตโนมัติทุก 15 วินาที (เมื่อเชื่อม Cloudflare Worker + D1)
- แสดงรายการที่เกินเวลาเกิดคาดการณ์เป็น "เลยกำหนด" **ไม่ถือว่าเกิดจริงแล้ว** จนกว่าจะมี Tomb ใหม่

## สำคัญ: GitHub Pages เก็บข้อมูลร่วมกันเองไม่ได้

ไฟล์นี้มี 2 ส่วน:

| ส่วน | ที่อยู่ใน ZIP | ใช้ทำอะไร |
|---|---|---|
| หน้าเว็บ | `index.html`, `assets/`, `data/`, `config.js` | นำไปลง GitHub Pages |
| ฐานข้อมูลกลาง | `worker/` | Deploy บน Cloudflare Workers + D1 |

**หากเปิดไฟล์โดยยังไม่เชื่อม Worker:** เว็บจะเข้าโหมดทดลองและเก็บข้อมูลใน `localStorage` ของเบราว์เซอร์เครื่องนั้นเท่านั้น (ไม่มีการแชร์ข้อมูล) เว็บจะมีป้ายเตือนให้เห็นชัดเจน

## 1) ตั้งฐานข้อมูล D1 และ Worker ของ Cloudflare

ต้องมี Cloudflare Account และ Node.js (สำหรับใช้ Wrangler CLI) โดยไม่ต้องสร้าง Backend Server เอง

1. แตก ZIP แล้วเปิด Terminal ในโฟลเดอร์ `worker/`
2. ล็อกอิน Cloudflare ด้วยคำสั่ง `npx wrangler login`
3. สร้างฐานข้อมูล: `npx wrangler d1 create mvp-boss-timer`
4. Cloudflare จะคืนค่า `database_id` เป็น UUID ให้คัดลอกมาใส่ใน `worker/wrangler.toml` แทน `REPLACE_WITH_YOUR_D1_DATABASE_ID`
5. สร้างตารางจริงบน Cloudflare:

   ```sh
   npx wrangler d1 execute mvp-boss-timer --remote --file=./schema.sql
   ```

6. Deploy API:

   ```sh
   npx wrangler deploy
   ```

7. จะได้ URL ประมาณ `https://mvp-boss-timer-api.<ชื่อบัญชี>.workers.dev`
8. ลองเปิด `https://mvp-boss-timer-api.<ชื่อบัญชี>.workers.dev/health` ต้องเห็น JSON `{"ok":true,...}`

**ทางเลือก:** สร้าง D1 และ Worker ผ่าน Cloudflare Dashboard ได้เช่นกัน แต่ต้อง Bind D1 เป็นตัวแปรชื่อ **`DB`** และรัน SQL ใน `worker/schema.sql` ก่อน

## 2) ตั้งค่าเว็บให้ทุกคนแชร์ข้อมูลกัน

เปิด `config.js` ที่ Root แล้วใส่ Worker URL ที่ได้จากขั้นตอนก่อนหน้า:

```js
window.MVP_CONFIG = {
  API_BASE: "https://mvp-boss-timer-api.yourname.workers.dev"
};
```

อย่าใส่ `/api/timers` ต่อท้าย URL; โค้ดจะต่อ path ให้เอง

เมื่อเชื่อมสำเร็จ ป้ายสถานะด้านบนเปลี่ยนเป็น **ออนไลน์ · แชร์ร่วมกัน** และข้อมูลที่ผู้เล่นกรอกจะบันทึกใน D1 ทุกคนเข้าลิงก์เดียวกันจึงเห็นข้อมูลเดียวกัน

## 3) Upload ไป GitHub Pages

1. สร้าง GitHub Repository แบบ Public เช่น `mvp-boss-timer`
2. Upload ไฟล์โฟลเดอร์ Root ดังนี้: `index.html`, `config.js`, `assets/`, `data/`, `worker/`, `README.md` (อย่าให้ `index.html` อยู่ใต้โฟลเดอร์ย่อย)
3. GitHub Repository → Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/ (root)` → Save
4. เมื่อเผยแพร่แล้วจะได้ URL `https://<USERNAME>.github.io/mvp-boss-timer/`
5. เปิดเว็บแล้วตรวจว่าแสดงสถานะ **ออนไลน์ · แชร์ร่วมกัน**
6. ทดสอบกรอกข้อมูลจากเครื่อง A แล้วเปิดหน้าเว็บจากเครื่อง B เพื่อเช็กว่าข้อมูลปรากฏตรงกัน (อาจใช้เวลาไม่เกิน 15 วินาทีสำหรับการรีเฟรชอัตโนมัติ)

## โครงสร้างไฟล์

```text
mvp-boss-timer/
├── index.html            # หน้าเว็บ
├── config.js             # ใส่ Worker URL
├── assets/
│   ├── app.js            # ฟังก์ชัน UI / เวลาไทย / ซิงก์
│   ├── style.css         # Responsive UI
│   └── bosses.js         # รายชื่อจาก data/bosses.json สำหรับเว็บ
├── data/
│   └── bosses.json       # รายชื่อบอสและแมพ (source of truth)
├── worker/
│   ├── index.js          # Cloudflare Worker API
│   ├── catalog.js        # รายการคู่ boss/map ที่ API ยอมรับ
│   ├── schema.sql        # D1 Database Schema
│   └── wrangler.toml     # ตั้งค่า Worker / D1
└── README.md
```

## รูปแบบข้อมูล API

- `GET /api/timers` — อ่านเวลาบอสที่บันทึกทั้งหมด
- `PUT /api/timers` — เพิ่ม/อัปเดตเวลาของบอส+แมพเดิม
- `DELETE /api/timers` — ลบเวลาของบอส+แมพ
- `GET /health` — ตรวจว่ารัน Worker ได้

เวลาจัดเก็บเป็น ISO UTC ส่วน UI แสดงเป็น Asia/Bangkok ตลอด หากเจอ Tomb เวลา `23:40` วันที่ 14 พฤศจิกายน จะคำนวณเกิด `01:40` วันที่ 15 พฤศจิกายนได้ถูกต้อง **ไม่ใช้ Delay มาตรฐานของ RateMyServer**

## แหล่งข้อมูลและข้อจำกัด

- รายชื่อ/แมพ: [RateMyServer Monster Database (Pre-Re), MVP Boss](https://ratemyserver.net/index.php?mob_search=Search&mvp=1&nspawn=1&page=mob_db) พร้อมหน้าต่อ 2–5
- ตัดแมพพิเศษที่เป็น Endless Tower / Wolfchev's Lab ออกจากตัวเลือกหลัก เพื่อลดความสับสน แต่คงแมพพิเศษ/เรียกบอสบางรายการที่อาจเกี่ยวข้องไว้พร้อมคำกำกับ
- RateMyServer เป็นข้อมูลเกมมาตรฐาน **ไม่ได้รับรองว่าแมพตรงกับเซิร์ฟเวอร์ Private ของคุณทุกแมพ**; ตรวจสอบจริงก่อนใช้
- บอสที่ปรากฏในเซิร์ฟเวอร์ของคุณอาจมีแมพ/ชื่อไม่ตรงหรือมีบอสเพิ่มเติม ต้องแก้ใน `data/bosses.json` แล้ว regenerate `assets/bosses.js` และ `worker/catalog.js` ให้ตรงกันก่อน deploy
- ความหมายของเวลาที่ได้คือ **คาดว่าจะเกิดตามสูตรตาย + 2 ชั่วโมง** ไม่ใช่การยืนยันว่าบอสเกิด/ตายจริง
- ไม่มี Account = ทุกคนที่เข้าถึง API สามารถเขียนทับและลบข้อมูลได้ อาจมีคนกรอกผิดหรือทำลายข้อมูลโดยตั้งใจได้; สำหรับกลุ่มใหญ่ควรเพิ่ม rate limiting, ระบบประวัติ/กู้คืน, หรือ moderation ในเวอร์ชันถัดไป
- ป้าย API online จะขึ้นเมื่อเชื่อมต่อ Worker สำเร็จเท่านั้น ไม่ใช่จาก GitHub Pages ลำพัง

## ทดสอบในเครื่อง

จากโฟลเดอร์ Root รัน:

```sh
python3 -m http.server 8000
```

แล้วเปิด `http://localhost:8000` เพื่อทดลอง local-only ก่อนเชื่อม Worker

Source copyrights remain with the respective owners. This project is an independent fan-made timer, not affiliated with RateMyServer.
