# MVP Boss Timer V1.17 — Online Count + Back to Top + Admin Settings

ต่อยอดจาก V1.16 โดย **ไม่เปลี่ยนรายชื่อบอส, รูป GIF, Cloudflare D1 เดิม, config.js และ notification-sw.js**

## สิ่งที่เพิ่ม

- **จำนวนคนออนไลน์:** แสดงในป้ายสีเขียวของโมดูล 02 เช่น `แชร์ออนไลน์ · 8 คน` เป็นจำนวนเบราว์เซอร์ที่มีสัญญาณใน 90 วินาทีล่าสุด ไม่ใช่จำนวนคนที่ยืนยันตัวตน (หลายแท็บในเบราว์เซอร์เดียวกันนับ 1)
- **Back to Top:** แสดงเมื่อเลื่อนลงไปเกิน 380 px กดเพื่อเลื่อนกลับด้านบน
- **ปุ่มเฟือง:** ให้กรอกรหัสผู้ดูแล โดยตรวจที่ Worker จาก Secret `ADMIN_PIN` (แนะนำให้ตั้งค่าเริ่มต้น 12345 ตามที่ตกลง แต่ PIN นี้เดาง่าย)
- **ตั้งเวลาบอส:** เลือกเวลาเกิดเริ่มต้นของทุกบอส (120 นาที), ตั้งเวลาเฉพาะบอส (Lord of Death 133 นาที), ช่วงปักหมุดกระพริบ (5 นาที), ระยะเวลาซ่อนจากโมดูล 03 (5 ชั่วโมง)
- **CSV:** ดาวน์โหลดข้อมูลบอสที่มีการบันทึกในตารางก่อนล้าง
- **ล้างข้อมูลทั้งหมด:** มีคำยืนยัน `CLEAR ALL` และใช้ PIN ที่ Worker ตรวจ โดยข้อมูลใน `boss_timers` จะถูกลบจริง; รายชื่อบอส, ตั้งค่า และรูป GIF จะไม่ถูกลบ

> **ข้อจำกัด:** ข้อมูลออนไลน์เป็นการประมาณจากการส่งสัญญาณทุก 30 วินาที โดยเบราว์เซอร์ที่ถูกพักอาจไม่นับหลัง 90 วินาที. เว็บไม่มีระบบ Account. PIN `12345` มีความเสี่ยงสูง เพราะเดาง่าย และผู้เล่นที่ทราบ PIN สามารถล้างข้อมูลได้ ควรเปลี่ยน PIN ให้เดายากขึ้นหากเว็บเปิดสาธารณะ.

## ขั้นตอนติดตั้ง — สำคัญ: ทำตามลำดับ

### 0. สำรองของเดิม

คัดลอก `index.html` เดิม และ `worker.js` เดิมเก็บไว้ก่อน. ถ้าเป็นไปได้ให้สำรอง D1 หรือเปิด Time Travel ของ D1 ด้วย. ไม่จำเป็นต้องลบตารางเดิม.

### 1. สร้างตาราง D1 เพิ่ม (ไม่ลบตารางเก่า)

Cloudflare Dashboard → Storage & databases → D1 SQL Database → `mvp-boss-timer` → Console

คัดลอกเนื้อหาทั้งหมดจาก `cloudflare/migrate-v1.17.sql` ไปวางและ Execute.

ระบบจะเพิ่มตาราง `app_settings` และ `online_presence` กับ index. ตาราง `boss_timers` เดิมไม่ถูกแก้ไขหรือลบ.

### 2. ตั้ง Secret สำหรับรหัสผู้ดูแล

Workers & Pages → `mvp-boss-timer-api` → Settings → Variables and Secrets → Add

- Type: **Secret** (ไม่ใช่ Text)
- Name: `ADMIN_PIN`
- Value: `12345`

กด Deploy เพื่อบันทึกการตั้งค่า. **ห้ามใส่รหัส 12345 ใน index.html, config.js หรือ worker.js.** Worker จะอ่านจากตัวแปร Secret นี้.

### 3. อัปเดต Cloudflare Worker

เปิด Worker `mvp-boss-timer-api` → Edit code → เลือก `worker.js` → แทนโค้ดทั้งหมดด้วยเนื้อหา `cloudflare/worker.js` → Deploy

**ทดสอบก่อนเปลี่ยน GitHub:**

- `https://mvp-boss-timer-api.wonghasadorn-chanon.workers.dev/health` ควรมี `ok: true` และ `version: 1.17`
- `https://mvp-boss-timer-api.wonghasadorn-chanon.workers.dev/api/timers` ควรแสดง `rows` และ `settings`
- `https://mvp-boss-timer-api.wonghasadorn-chanon.workers.dev/api/presence` ควรมี `onlineCount` (เริ่มต้น 0 ก็ได้)
- `https://mvp-boss-timer-api.wonghasadorn-chanon.workers.dev/api/settings` ควรมี `defaultRespawnMinutes: 120` และ `bossOverrides: {"1373":133}`

ถ้าคืนค่า `Missing D1 tables` ให้ย้อนกลับไปทำขั้นตอน 1.

### 4. อัปเดต GitHub Pages

ไปที่ Repository `https://github.com/wchanon0909/MVP-Boss-Timer` อัปโหลด `github/index.html` **แทน `index.html` เดิมที่ Root** แล้ว Commit.

**ไม่ต้องแก้ `config.js`, `notification-sw.js`, D1 Binding `DB`, หรือ `assets/mobs/`**.

เข้า `https://wchanon0909.github.io/MVP-Boss-Timer/?v=1.17` และกด Ctrl+Shift+R ถ้ายังเห็น V1.16.

### 5. ทดสอบการใช้งานจริง

1. เปิดเว็บจาก Chrome และ Edge อีกเครื่องแล้วดูตัวเลขออนไลน์ (อาจใช้เวลาถึง 30 วินาที).
2. เลื่อนลงกลางหน้า ต้องเห็นปุ่มลูกศรขึ้นมุมขวาล่าง.
3. กดเฟือง → ใส่รหัส 12345 → ต้องเห็นค่าตั้งต้น 120 นาที, Lord of Death 133 นาที, เพิ่งเกิด 5 นาที, ซ่อนหลัง 5 ชั่วโมง.
4. ลองปรับเพียงค่าที่ต้องการและกดบันทึก. เปิดเว็บอีกเครื่องเพื่อยืนยันข้อมูลตรงกัน.
5. กดสำรอง CSV ก่อนใช้ปุ่มล้างข้อมูลทั้งหมด; **อย่าทดลองปุ่มล้างบนตารางที่ใช้งานจริง** หากไม่ต้องการลบข้อมูล.

## สิ่งที่คงไว้

- หน้าตาเดิม, GIF จาก GitHub, MVP Gallery, Eddga1/Eddga2, เก็บเวลา Tomb, แจ้งเตือนที่ปิดเริ่มต้น, Light/Dark Mode, RateMyServer info, หน้าแบบ Desktop
- แยกเวลาบอสตามคู่ `bossId` + `mapId`
- ไม่ต้องเพิ่มบัญชีผู้เล่น

## หมายเหตุการทำงานของระบบ

- Worker เป็นแหล่งตั้งค่ากลาง และเก็บค่าใน `app_settings`. เมื่อเปลี่ยนเวลาเกิด Worker จะคำนวณ `spawn_at` ของรายการเก่าที่บันทึกไว้ให้สอดคล้องด้วย โดย **ไม่เปลี่ยน `tomb_at`**.
- หน้าเว็บจะอัปเดตค่าจาก `/api/timers` โดยอัตโนมัติทุก 15 วินาที.
- ล้างข้อมูลทั้งหมดจะลบทุกแถวใน `boss_timers` จริง ไม่ลบตาราง ไม่ลบข้อมูลรายชื่อบอส.
- ปุ่มเฟืองล็อกใหม่ทุกครั้งที่ปิดหน้าต่าง ไม่จำรหัสไว้ใน localStorage.
- หากสร้างตารางเสร็จแต่ยังไม่อัปเดต Worker เว็บไซต์เก่ายังทำงานตามเดิมได้.

## การทดสอบที่ดำเนินการ

- Worker: 23 กรณีครอบคลุม GET/PUT/DELETE, การปรับเวลาเกิด, การยืนยัน PIN, การอัปเดต D1, การนับผู้ใช้งาน, การล้างข้อมูล, และการตรวจ JSON
- หน้าเว็บ: จำลอง API ผ่าน Chromium ทดสอบการแสดงจำนวนออนไลน์, PIN ถูก/ผิด, แก้ค่าเวลา, ส่งออก CSV, ล้างข้อมูล, แสดง Back to Top, เปลี่ยนธีม
- ยังไม่ได้ Deploy Worker หรือเปลี่ยน Repository จริง และยังไม่ได้ทดสอบตัวเลขคนออนไลน์บน Cloudflare D1 ที่ใช้งานจริง
