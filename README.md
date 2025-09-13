# AI Assistant Server - Ünlü Kişilerle Sohbet

Bu proje, kullanıcıların ünlü kişilerle (Atatürk, Newton, Fatih Sultan Mehmet, Einstein, Leonardo da Vinci) sohbet edebilmesini sağlayan bir API sunucusudur.

## Özellikler

- ✅ Google OAuth ile giriş
- ✅ Ünlü kişi seçimi (Atatürk, Newton, Fatih Sultan Mehmet, Einstein, Leonardo da Vinci)
- ✅ Seçilen ünlü kişiye göre ChatGPT manipülasyonu
- ✅ Kullanıcıların kendi OpenAI API anahtarlarını kullanması (maliyet tasarrufu)
- ✅ Gerçek zamanlı sohbet

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Environment dosyasını oluşturun:
```bash
cp env.example .env
```

3. `.env` dosyasını düzenleyin ve Google Client ID'nizi ekleyin:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
PORT=3000
```

4. Sunucuyu başlatın:
```bash
npm start
```

## API Endpoints

### 1. Ünlü Kişiler Listesi
```
GET /api/famous-people
```
Mevcut ünlü kişilerin listesini döner.

**Response:**
```json
{
  "success": true,
  "people": [
    {
      "id": "atatürk",
      "name": "Mustafa Kemal Atatürk",
      "description": "Türkiye Cumhuriyeti'nin kurucusu ve ilk cumhurbaşkanı",
      "era": "1881-1938"
    }
  ]
}
```

### 2. OpenAI API Anahtarı Kaydetme
```
POST /api/save-token
```

**Request Body:**
```json
{
  "googleToken": "google_oauth_token",
  "openaiApiKey": "sk-your-openai-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OpenAI API anahtarı başarıyla kaydedildi"
}
```

### 3. Ünlü Kişiyle Sohbet
```
POST /api/chat
```

**Request Body:**
```json
{
  "message": "Merhaba, nasılsınız?",
  "googleToken": "google_oauth_token",
  "famousPersonId": "atatürk"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Merhaba! Ben Mustafa Kemal Atatürk...",
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "picture": "profile_picture_url"
  },
  "famousPerson": {
    "name": "Mustafa Kemal Atatürk",
    "description": "Türkiye Cumhuriyeti'nin kurucusu ve ilk cumhurbaşkanı",
    "personality": "Vatansever, devrimci, ilerici...",
    "era": "1881-1938",
    "expertise": "Askeri strateji, devlet yönetimi..."
  }
}
```

### 4. Sağlık Kontrolü
```
GET /api/health
```

## Kullanım Akışı

1. **Google ile giriş yapın** - Google OAuth token alın
2. **OpenAI API anahtarınızı kaydedin** - `/api/save-token` endpoint'ini kullanın
3. **Ünlü kişi listesini alın** - `/api/famous-people` endpoint'ini kullanın
4. **Ünlü kişi seçin** - İstediğiniz ünlü kişinin ID'sini kullanın
5. **Sohbet edin** - `/api/chat` endpoint'ini kullanarak seçtiğiniz ünlü kişiyle konuşun

## Güvenlik

- Kullanıcıların OpenAI API anahtarları sunucuda geçici olarak saklanır
- Google OAuth ile kimlik doğrulama yapılır
- API anahtarları test edilir ve geçerli olduğu doğrulanır

## Notlar

- Her kullanıcı kendi OpenAI API anahtarını kullanır, bu sayede maliyet sizin üzerinizde kalmaz
- Ünlü kişiler kendi dönemlerindeki bilgi ve kişilik özelliklerine göre cevap verir
- Modern konularda bilgisi olmayan ünlü kişiler bunu açıkça belirtir
