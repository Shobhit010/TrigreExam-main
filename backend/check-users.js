const mongoose = require('mongoose');
async function run() {
    await mongoose.connect('mongodb://root:root@134.209.146.122:27017/?authSource=admin', { dbName: 'development' });
    const users = await mongoose.connection.db.collection('users').find({
        $or: [{ mobile: '6205028132' }, { firstname: /Raushan/i }, { student_id: '69a03019345fe250e5293cfc' }]
    }).project({ _id: 1, student_id: 1, mobile: 1, firstname: 1, password: 1 }).toArray();

    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
}
run();
