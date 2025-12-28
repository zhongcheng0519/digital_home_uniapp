import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'

const AES_KEY_SIZE = 256
const AES_IV_SIZE = 128
const RSA_KEY_SIZE = 2048

function generateRandomBytes(nBytes) {
  const bytes = new Uint8Array(nBytes)
  for (let i = 0; i < nBytes; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes
}

function bytesToWordArray(bytes) {
  const words = []
  for (let i = 0; i < bytes.length; i += 4) {
    const word = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]
    words.push(word)
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length)
}

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
  const iv = bytesToWordArray(generateRandomBytes(16))
  const encrypted = CryptoJS.AES.encrypt(privateKey, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  const combined = iv.concat(encrypted.ciphertext)
  const result = combined.toString(CryptoJS.enc.Base64)
  
  console.log('=== 加密私钥 ===')
  console.log('密码长度:', password.length)
  console.log('密码:', password)
  console.log('密钥 (hex):', key.toString(CryptoJS.enc.Hex))
  console.log('IV (hex):', iv.toString(CryptoJS.enc.Hex))
  console.log('私钥长度:', privateKey.length)
  console.log('加密结果 (base64):', result.substring(0, 50) + '...')
  
  return result
}

export function decryptPrivateKey(encryptedPrivateKey, password) {
  try {
    console.log('=== 解密私钥 ===')
    console.log('密码长度:', password.length)
    console.log('密码:', password)
    console.log('加密数据 (base64):', encryptedPrivateKey.substring(0, 50) + '...')
    
    const key = CryptoJS.enc.Utf8.parse(password)
    console.log('密钥 (hex):', key.toString(CryptoJS.enc.Hex))
    
    const combined = CryptoJS.enc.Base64.parse(encryptedPrivateKey)
    console.log('解析后的数据长度:', combined.sigBytes)
    
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4))
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4))
    
    console.log('IV (hex):', iv.toString(CryptoJS.enc.Hex))
    console.log('密文长度:', ciphertext.sigBytes)
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext },
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    )
    
    const result = decrypted.toString(CryptoJS.enc.Utf8)
    console.log('解密结果长度:', result.length)
    console.log('解密结果:', result.substring(0, 50) + '...')
    
    return result
  } catch (error) {
    console.error('解密错误:', error)
    throw new Error('私钥解密失败')
  }
}

export function encryptData(text, aesKey) {
  const key = CryptoJS.enc.Utf8.parse(aesKey)
  const iv = bytesToWordArray(generateRandomBytes(16))
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
  const key = bytesToWordArray(generateRandomBytes(32))
  return key.toString(CryptoJS.enc.Hex).substring(0, 32)
}
