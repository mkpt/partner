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
const csvFilePath = path.join(__dirname, 'build/data/phrases.csv');
if (fs.existsSync(csvFilePath)) {
  fs.createReadStream(csvFilePath)
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
          Japanese: japanese,
        });
      } else {
        console.log('Missing Japanese field in row:', row);
      }
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
      console.log('Phrases:', phrases); // Log the loaded phrases for debugging
    })
    .on('error', (error) => {
      console.error('Error reading CSV file:', error);
    });
} else {
  console.error('CSV file does not exist:', csvFilePath);
}

app.use(express.static(path.join(__dirname, 'build')));
app.use('/audio', express.static(path.join(__dirname, 'build/audio')));

app.get('/phrases', (req, res) => {
  if (phrases.length > 0) {
    res.json(phrases);
  } else {
    res.status(404).json({ error: 'No phrases found' });
  }
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
    const audioFilePath = path.join(__dirname, 'build/audio', `${languageCode}-${Date.now()}.mp3`);
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
