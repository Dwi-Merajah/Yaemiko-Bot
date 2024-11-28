## Base-pairing By Dwi-Merajah WhatsApp Bot 🤖💬

Skrip ini menyediakan penanganan perintah untuk bot WhatsApp menggunakan library Baileys. Dengan skrip ini, Anda dapat dengan mudah mendefinisikan perintah dengan berbagai opsi dan kategori, serta menghasilkan menu perintah otomatis.

### Fitur 🎉:

* **Penanganan Perintah:** Definisikan perintah dengan banyak alias, argumen, dan opsi.
* **Kategori:** Kelompokkan perintah ke dalam kategori untuk organisasi dan pembuatan menu yang lebih baik.
* **Perintah Admin/Pemilik:** Batasi perintah tertentu hanya untuk admin grup atau pemilik bot.
* **Jalankan Perintah:** Jalankan perintah shell atau kode JavaScript (hanya pemilik).
* **Pembuatan Menu Otomatis:** Hasilkan menu dengan semua perintah yang tersedia dan penggunaannya.
* **Hot-reloading:** Secara otomatis memuat ulang skrip ketika ada perubahan.

### Install Script Bot 🚀:

```bash
1. git clone https://github.com/Dwi-Merajah/base-pairing
2. cd /base-pairing
3. yarn install
4. node index.js
```

### Edit File `config.js` 🔧:

```javascript
global.owner = ["62xxx"]; // Tambahkan nomor owner: ["nomor 1", "nomor 2", "nomor 3"]
global.namebot = "nama"; // Nama bot
global.author = "author"; // Nama pembuat
global.status = {
  wait: "*Please wait a moment*",
  done: "*Successfully Responded*",
  owner: "*This feature is specifically for creators*",
  execute: "*Run execution..*"
};
```

### Menambahkan Fitur Baru ✨:

Gunakan metode `core.command()` untuk mendefinisikan perintah baru.

Contoh:
```javascript
core.command(["hello", "hi"], async (m, { core }) => {
  core.reply(m.chat, "Halo!", m);
}, { category: 'main' });
```

**Opsi:**
* `admin`: `true` jika perintah hanya untuk admin grup.
* `bot`: `true` jika bot perlu menjadi admin untuk menjalankan perintah.
* `owner`: `true` jika perintah hanya untuk pemilik bot.
* `category`: Kategori perintah (misalnya, "main", "downloader").
* `use`: Contoh penggunaan perintah (misalnya, "<url>").

### Implementasikan Fungsi Callback 🧑‍💻:

Fungsi callback menerima objek dengan properti berikut:
* `m`: Objek pesan.
* `core`: Objek inti bot.
* `args`: Array argumen yang diteruskan ke perintah.
* `text`: Teks lengkap pesan setelah perintah.
* `isOwner`: `true` jika pengirim adalah pemilik bot.
* `func`: Fungsi bantuan (misalnya, `func.tag(m.sender)`, `func.greeting()`).
* `prefix`: Awalan yang digunakan untuk perintah.
* `executing`: Array awalan perintah khusus (misalnya, `">"`, `"=>", "$"`).
* `groupMetadata`: Metadata grup (jika perintah ada di grup).
* `command`: Perintah yang dipicu.

### Menambahkan Perintah ke Kategori 📁:

* Tentukan opsi `category` dalam metode `core.command()`.
* Jika kategori belum ada, kategori akan dibuat secara otomatis.

### (Opsional) Tambahkan Contoh Penggunaan 📑:

* Tentukan opsi `use` dalam metode `core.command()` untuk memberikan contoh penggunaan untuk perintah tersebut.

---

### Penjelasan Kode Bot WhatsApp 📲🤖

Skrip ini menggunakan beberapa library untuk membuat bot WhatsApp yang dapat mengelola sesi, menangani perintah, serta mengelola koneksi dan komunikasi dengan WhatsApp Web. Berikut adalah penjelasan tentang bagian-bagian utama dalam kode.

#### 1. **Impor Dependensi** 📦

```javascript
const fs = require('fs');
const path = require('path');
const readline = require("readline");
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const color = require("./files/color.js");
const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, makeInMemoryStore, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const log = console.log;
const { socket, smsg } = require("./files/socket");
```

Bagian ini mengimpor beberapa modul dan dependensi yang diperlukan untuk menjalankan bot. Beberapa di antaranya adalah:
- `fs`, `path`: Untuk menangani file dan path sistem.
- `readline`: Untuk mengambil input dari pengguna (seperti nomor WhatsApp).
- `Boom`: Untuk menangani dan membuat error dengan lebih terstruktur.
- `pino`: Untuk logging yang lebih mudah dan terstruktur.
- `baileys`: Library utama yang digunakan untuk berinteraksi dengan WhatsApp Web API.

#### 2. **Inisialisasi Bot** 🛠️

```javascript
class WhatsAppBot {
    constructor() {
        this.store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
        this.logger = pino({ level: 'silent', stream: 'store' });
    }

    async initialize() {
        const { state, saveCreds } = await useMultiFileAuthState(process.cwd() + "/files/sessions");
        const { version } = await fetchLatestBaileysVersion();
        const core = socket({ 
            version,
            logger: this.logger,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, this.logger)
            },
            mobile: false,
            printQRInTerminal: false,
            browser: Browsers.ubuntu("Chrome"),
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            retryRequestDelayMs: 10,
            transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 10 },
            maxMsgRetryCount: 15,
            appStateMacVerification: { patch: true, snapshot: true }
        });
        this.store.bind(core.ev);
        await this.pairing(core);
        await this.events(core, saveCreds);
        return core;
    }
}
```

Di dalam kelas `WhatsAppBot`, `initialize()` adalah metode utama untuk menginisialisasi koneksi dengan WhatsApp. Di sini, bot:
- Menggunakan `useMultiFileAuthState` untuk mengelola status autentikasi dan kredensial yang disimpan.
- Mengambil versi terbaru dari Baileys dengan `fetchLatestBaileysVersion`.
- Membuat koneksi dengan WhatsApp Web menggunakan objek `socket`, di mana konfigurasi seperti pengaturan versi dan kredensial didefinisikan.

#### 3. **Pairing dan Autentikasi** 🔐

```javascript
async pairing(core) {
    if (core.authState && !core.authState.creds.registered) {
        const phone = await this.getPhoneNumber();
        setTimeout(async () => {
            let code = await core.requestPairingCode(phone);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            log(`Your Pairing Code: ${code}`);
        }, 3000);
    } else {
        log(color.cyan("[ ✓ ] Connected To WhatsApp"))
    }
}
```

Metode `pairing()` digunakan untuk memulai proses pairing jika bot belum terdaftar. Pengguna diminta untuk memasukkan nomor WhatsApp, dan bot kemudian meminta kode pairing yang akan ditampilkan di terminal.

#### 4. **Menangani Koneksi dan Peristiwa** 🔄

```javascript
async events(core, saveCreds) {
    if (core && core.ev) {
        core.ev.on('connection.update', async update => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                await this.handleDisconnection(new Boom(lastDisconnect?.error)?.output.statusCode);
            }
        });
        core.ev.on('creds.update', saveCreds);
        core.ev.on('messages.upsert', async (chatUpdate) => {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message;
            smsg(core, m, this.store);
            require('./files/cmd.js')(core, m, chatUpdate, this.store)
        });
    }
}
```

Metode `events()` menangani berbagai pembaruan dan peristiwa yang terjadi selama sesi:
- `connection.update`: Memantau status koneksi dan menangani pemutusan sambungan.
- `creds.update`: Memperbarui kredensial ketika ada perubahan.
- `messages.upsert`: Menangani pesan yang masuk dan memicu perintah yang relevan.

#### 5. **Menangani Pemutusan Koneksi** 🔌

```javascript
async handleDisconnection(reason) {
    switch (reason) {
        case DisconnectReason.badSession:
            log(color.red(`Bad Session File, Please Delete Session and Scan Again`));
            break;
        case DisconnectReason.connectionClosed:
            log(color.yellow(`Connection closed, reconnecting....`));


            break;
        case DisconnectReason.connectionLost:
            log(color.yellow(`Connection Lost from Server, reconnecting...`));
            break;
        case DisconnectReason.connectionReplaced:
            log(color.red(`Connection Replaced, Another New Session Opened, Please Close Current Session First`));
            break;
        case DisconnectReason.loggedOut:
            log(color.red(`Device Logged Out, Please Scan Again And Run.`));
            break;
        case DisconnectReason.restartRequired:
            log(color.yellow(`Restart Required, Restarting...`));
            break;
        case DisconnectReason.timedOut:
            log(color.yellow(`Connection TimedOut, Reconnecting...`));
            break;
        default:
            log(color.red(`Unknown DisconnectReason: ${reason}`));
            break;
    }
    await this.initialize();
}
```

Metode `handleDisconnection()` menangani berbagai alasan pemutusan koneksi, seperti file sesi yang rusak atau masalah jaringan. Setelah menangani alasan pemutusan, bot akan mencoba untuk menginisialisasi kembali koneksi.

#### 6. **Meminta Nomor WhatsApp** 📱

```javascript
async getPhoneNumber() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(color.yellow('Enter your WhatsApp number: '), num => {
            rl.close();
            resolve(num);
        });
    });
}
```

Metode `getPhoneNumber()` meminta pengguna untuk memasukkan nomor WhatsApp mereka melalui input terminal.

#### Menjalankan Bot

Di akhir skrip, bot dijalankan dengan memanggil `initialize()`:

```javascript
(async () => {
    const bot = new WhatsAppBot();
    await bot.initialize();
})();
```

---

**Catatan:** 
Kode ini memungkinkan bot untuk melakukan berbagai fungsi WhatsApp seperti menerima dan mengirim pesan, menangani perintah, serta memantau status koneksi. Anda bisa menyesuaikan dan memperluas fitur bot ini sesuai dengan kebutuhan Anda. 😊
