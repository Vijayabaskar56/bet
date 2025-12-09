import decryptEncrypt from "./decryptEncrypt.js";

function responseEncryptor(req, res, next) {
    if(process.env.PRODUCTION=="true"){
        const originalSend = res.json;
        res.json = (data) => {
            const encryptedData = decryptEncrypt.encrypt(JSON.stringify(data), process.env.CLIENT_SECRET);
            originalSend.call(res, {encrypted : encryptedData});
        };
    }
    
    next();
}
export default responseEncryptor