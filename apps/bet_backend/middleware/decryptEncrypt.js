import CryptoJS from "crypto-js";


//encrypt
function encrypt(txt, secret = process.env.ENCRYPT_DECRYPT_SECRET_KEY) {
   const ciphertext = CryptoJS.AES.encrypt(txt, secret).toString();
   return ciphertext
}

// Decrypt
function decrypt(encryptTxt, secret = process.env.ENCRYPT_DECRYPT_SECRET_KEY) {
   const bytes = CryptoJS.AES.decrypt(encryptTxt, secret)
   const originalText = bytes.toString(CryptoJS.enc.Utf8);
   return originalText
}

export default { encrypt, decrypt }
