require('dotenv').config();
const mongoose = require('mongoose');
// const Media = require('../models/Media');

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log('Connected to MongoDB');

  const items = await Media.find({ url: { $exists: false }, filename: { $exists: true } });

  console.log(`Found ${items.length} items to update`);

  for (const item of items) {
    const filename = item.filename;
    if (!filename) continue;

    const newUrl = `/uploads/${filename}`;

    item.url = newUrl;
    await item.save();
    console.log(`Updated ${item._id} -> ${newUrl}`);
  }

  console.log('Migration complete');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration error', err);
  process.exit(1);
});
