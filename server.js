const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const OpenAI = require('openai');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ai-assistant', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Middleware
app.use(cors());
app.use(express.json());

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Famous people database
const famousPeople = {
  'atatürk': {
    name: 'Mustafa Kemal Atatürk',
    description: 'Türkiye Cumhuriyeti\'nin kurucusu ve ilk cumhurbaşkanı',
    personality: 'Vatansever, devrimci, ilerici, kararlı ve cesur bir lider. Türk halkının bağımsızlığı ve modernleşmesi için çalışmıştır.',
    era: '1881-1938',
    expertise: 'Askeri strateji, devlet yönetimi, eğitim reformları, kadın hakları, dil reformu'
  },
  'newton': {
    name: 'Isaac Newton',
    description: 'İngiliz fizikçi, matematikçi ve astronom',
    personality: 'Analitik düşünen, meraklı, sabırlı ve detaycı bir bilim insanı. Doğa yasalarını anlamaya çalışır.',
    era: '1643-1727',
    expertise: 'Fizik, matematik, astronomi, optik, kalkülüs'
  },
  'fatih': {
    name: 'Fatih Sultan Mehmet',
    description: 'Osmanlı İmparatorluğu\'nun 7. padişahı ve İstanbul\'un fatihi',
    personality: 'Stratejik düşünen, cesur, kültürlü ve vizyoner bir hükümdar. Bilime ve sanata değer verir.',
    era: '1432-1481',
    expertise: 'Askeri strateji, devlet yönetimi, kültür, sanat, bilim'
  },
  'einstein': {
    name: 'Albert Einstein',
    description: 'Alman-Amerikan teorik fizikçi',
    personality: 'Yaratıcı, meraklı, sade ve anlaşılır konuşan bir bilim insanı. Evrenin sırlarını çözmeye çalışır.',
    era: '1879-1955',
    expertise: 'Fizik, matematik, felsefe, müzik'
  },
  'leonardo': {
    name: 'Leonardo da Vinci',
    description: 'İtalyan Rönesans dönemi sanatçısı ve bilim insanı',
    personality: 'Çok yönlü, yaratıcı, meraklı ve gözlemci bir deha. Sanat ve bilimi birleştirir.',
    era: '1452-1519',
    expertise: 'Sanat, anatomi, mühendislik, mimari, botanik'
  }
};

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/ai-assistant', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Verify Google token
async function verifyGoogleToken(token) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}

// Prompt manipulation function
function manipulatePrompt(userQuestion, userInfo, famousPersonId) {
  const famousPerson = famousPeople[famousPersonId];
  
  if (!famousPerson) {
    throw new Error('Geçersiz ünlü kişi seçimi');
  }

  const systemPrompt = `Sen ${famousPerson.name} olarak konuşuyorsun. 

Kişilik özelliklerin: ${famousPerson.personality}
Uzmanlık alanların: ${famousPerson.expertise}
Yaşadığın dönem: ${famousPerson.era}

${famousPerson.name} olarak:
- Kendi dönemindeki bilgi ve deneyimlerinle cevap ver
- Kişiliğine uygun bir dil ve üslup kullan
- Sadece kendi uzmanlık alanlarında ve yaşadığın dönemdeki konularda kesin bilgi ver
- Modern konularda bilgin yoksa bunu açıkça belirt
- Türkçe konuş ve kendi dönemindeki ifadeleri kullan

Kullanıcı: ${userInfo.name} (${userInfo.email})`;
  
  return {
    system: systemPrompt,
    user: userQuestion
  };
}

// Routes

// Get list of famous people
app.get('/api/famous-people', (req, res) => {
  const peopleList = Object.keys(famousPeople).map(id => ({
    id,
    name: famousPeople[id].name,
    description: famousPeople[id].description,
    era: famousPeople[id].era
  }));
  
  res.json({
    success: true,
    people: peopleList
  });
});

// Save user's OpenAI API key
app.post('/api/save-token', async (req, res) => {
  try {
    const { googleToken, openaiApiKey } = req.body;

    if (!googleToken || !openaiApiKey) {
      return res.status(400).json({ error: 'Google token and OpenAI API key required' });
    }

    // Verify Google token
    const userInfo = await verifyGoogleToken(googleToken);
    
    // Test the OpenAI API key
    const testOpenai = new OpenAI({ apiKey: openaiApiKey });
    try {
      await testOpenai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      });
    } catch (error) {
      return res.status(400).json({ error: 'Geçersiz OpenAI API anahtarı' });
    }

    // Save user's API key to MongoDB
    await User.findOneAndUpdate(
      { email: userInfo.email },
      { 
        email: userInfo.email,
        name: userInfo.name,
        openaiApiKey: openaiApiKey
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'OpenAI API anahtarı başarıyla kaydedildi'
    });

  } catch (error) {
    console.error('Save token error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Chat with famous person
app.post('/api/chat', async (req, res) => {
  try {
    const { message, googleToken, famousPersonId } = req.body;

    if (!message || !googleToken || !famousPersonId) {
      return res.status(400).json({ error: 'Message, Google token and famous person ID required' });
    }

    // Verify Google token
    const userInfo = await verifyGoogleToken(googleToken);
    
    // Get user's OpenAI API key from MongoDB
    const userDoc = await User.findOne({ email: userInfo.email });
    if (!userDoc || !userDoc.openaiApiKey) {
      return res.status(400).json({ 
        error: 'OpenAI API anahtarınızı kaydetmeniz gerekiyor. Lütfen önce /api/save-token endpoint\'ini kullanın.' 
      });
    }
    const userApiKey = userDoc.openaiApiKey;

    // Create OpenAI client with user's API key
    const userOpenai = new OpenAI({ apiKey: userApiKey });
    
    // Manipulate prompt
    const { system, user } = manipulatePrompt(message, userInfo, famousPersonId);

    // Call OpenAI with user's API key
    const completion = await userOpenai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    res.json({
      success: true,
      response,
      user: userInfo,
      famousPerson: famousPeople[famousPersonId]
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
