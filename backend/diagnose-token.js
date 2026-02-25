const mongoose = require('mongoose');
const crypto = require('crypto');

// Use same algorithm and key derivation as auth.service.ts
const ALGORITHM = 'aes-256-gcm';
const JWT_SECRET = 'a7f3d9e2b4c6f8a1d3e5b7c9f2a4d6e8b1c3f5a7d9e2b4c6f8a1d3e5b7c9f2a4';

function getEncryptionKey() {
    return crypto.createHash('sha256').update(JWT_SECRET).digest();
}

function decryptToken(stored) {
    try {
        const parts = stored.split(':');
        if (parts.length !== 3) return "ERROR: Invalid format (not 3 parts)";
        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const key = getEncryptionKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch (e) {
        return "ERROR: Decryption failed: " + e.message;
    }
}

async function run() {
    await mongoose.connect('mongodb://root:root@134.209.146.122:27017/?authSource=admin', { dbName: 'development' });
    const user = await mongoose.connection.db.collection('users').findOne({ mobile: '6205028132' });

    if (!user) {
        console.log("User not found in database.");
    } else {
        console.log("User found:", user.firstname, user.lastname);
        console.log("Stored Encrypted Token:", user.ruppi_token_encrypted ? "PRESENT" : "MISSING");
        if (user.ruppi_token_encrypted) {
            const decrypted = decryptToken(user.ruppi_token_encrypted);
            console.log("Decryption test:", decrypted.startsWith("ERROR") ? decrypted : "SUCCESS (Token is valid string)");
        }
    }
    await mongoose.disconnect();
}

run();
