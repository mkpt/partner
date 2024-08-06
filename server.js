const express = require('express');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new textToSpeech.TextToSpeechClient();

let phrases = [];

// Read the CSV file
fs.createReadStream('public/phrases.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Manually handle the field names
    const english = row['English'] ? row['English'].trim() : '';
    const romanized = row[' Romanized'] ? row[' Romanized'].trim() : '';
    const japanese = row[' Japanese'] ? row[' Japanese'].trim() : '';

    if (japanese) {
      phrases.push({
        English: english,
        Romanized: romanized,
        Japanese: japanese
      });
    } else {
      console.log('Missing Japanese field in row:', row);
    }
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log('Phrases:', phrases); // Log the loaded phrases for debugging
  });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));

app.get('/phrases', (req, res) => {
  res.json(phrases);
});

app.get('/synthesize', async (req, res) => {
  const { text, languageCode } = req.query;

  if (!text || !languageCode) {
    return res.status(400).json({ error: 'Missing text or languageCode query parameter' });
  }

  const request = {
    input: { text },
    voice: { languageCode, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    const audioFilePath = path.join(__dirname, 'public/audio', `${languageCode}-${Date.now()}.mp3`);
    await writeFile(audioFilePath, response.audioContent, 'binary');

    res.json({ audioUrl: `/audio/${path.basename(audioFilePath)}` });
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
