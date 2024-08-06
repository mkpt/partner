const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, 'src/data/phrases.csv');
const jsonFilePath = path.join(__dirname, 'build/data/phrases.json');

csv()
  .fromFile(csvFilePath)
  .then((jsonObj) => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObj, null, 2));
    console.log('CSV file successfully converted to JSON');
  })
  .catch((error) => {
    console.error('Error converting CSV to JSON:', error);
  });
