const crypto = require('crypto');

module.exports = {
    init: function(value){
        this._value = value;
        return this;
    },
    encrypt: function(key){
        if(!key) key = Candy.Config.encrypt.key;
        const iv = '2dea8a25e5e8f004';
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(this._value);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('base64');
    },
    decrypt: function(key){
        if(!key) key = Candy.Config.encrypt.key;
        const iv = '2dea8a25e5e8f004';
        try{
            const encryptedText = Buffer.from(this._value, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch(e){
            console.log(e);
            return null;
        }
    }
};