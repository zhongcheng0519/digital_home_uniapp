import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'

const AES_KEY_SIZE = 256
const AES_IV_SIZE = 128
const RSA_KEY_SIZE = 2048

export function generateRSAKeyPair() {
  const crypt = new JSEncrypt({ default_key_size: RSA_KEY_SIZE })
  const publicKey = crypt.getPublicKey()
  const privateKey = crypt.getPrivateKey()
  return {
    publicKey,
    privateKey
  }
}

export function encryptPrivateKey(privateKey, password) {
  const key = CryptoJS.enc.Utf8.parse(password)
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(privateKey, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  const combined = iv.concat(encrypted.ciphertext)
  return combined.toString(CryptoJS.enc.Base64)
}

export function decryptPrivateKey(encryptedPrivateKey, password) {
  try {
    const key = CryptoJS.enc.Utf8.parse(password)
    const combined = CryptoJS.enc.Base64.parse(encryptedPrivateKey)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4))
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4))
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext },
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    )
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    throw new Error('私钥解密失败')
  }
}

export function encryptData(text, aesKey) {
  const key = CryptoJS.enc.Utf8.parse(aesKey)
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  const combined = iv.concat(encrypted.ciphertext)
  return combined.toString(CryptoJS.enc.Base64)
}

export function decryptData(ciphertext, aesKey) {
  try {
    const key = CryptoJS.enc.Utf8.parse(aesKey)
    const combined = CryptoJS.enc.Base64.parse(ciphertext)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4))
    const encryptedData = CryptoJS.lib.WordArray.create(combined.words.slice(4))
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedData },
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    )
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    throw new Error('数据解密失败')
  }
}

export function encryptKeyWithRSA(aesKey, userPublicKey) {
  const crypt = new JSEncrypt()
  crypt.setPublicKey(userPublicKey)
  const encrypted = crypt.encrypt(aesKey)
  if (!encrypted) {
    throw new Error('RSA 加密失败')
  }
  return encrypted
}

export function decryptKeyWithRSA(encryptedKey, privateKey) {
  const crypt = new JSEncrypt()
  crypt.setPrivateKey(privateKey)
  const decrypted = crypt.decrypt(encryptedKey)
  if (!decrypted) {
    throw new Error('RSA 解密失败')
  }
  return decrypted
}

export function generateAESKey() {
  const key = CryptoJS.lib.WordArray.random(32)
  return key.toString(CryptoJS.enc.Hex).substring(0, 32)
}
