const mongoose = require('mongoose');
const fs = require('fs');
const MONGO_URI = 'mongodb://root:root@134.209.146.122:27017/?authSource=admin';

async function run() {
    await mongoose.connect(MONGO_URI, { dbName: 'development' });
    const user = await mongoose.connection.db.collection('users').findOne({ mobile: '6205028132' });
    fs.writeFileSync('user_dump_clean.json', JSON.stringify(user, null, 2), 'utf8');
    await mongoose.disconnect();
}

run().catch(err => {
    fs.writeFileSync('user_dump_error.txt', err.stack, 'utf8');
});
