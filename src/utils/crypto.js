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

function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return uni.arrayBufferToBase64(buffer)
}

function base64ToArrayBuffer(base64) {
  return uni.base64ToArrayBuffer(base64)
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

export async function encryptPrivateKey(privateKey, password) {
  console.log('=== 加密私钥 ===')
  console.log('密码长度:', password.length)
  console.log('密码:', password)
  console.log('私钥长度:', privateKey.length)
  
  const passwordBuffer = new TextEncoder().encode(password)
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  console.log('Salt (hex):', arrayBufferToHex(salt))
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  console.log('IV (hex):', arrayBufferToHex(iv))
  
  const privateKeyBuffer = new TextEncoder().encode(privateKey)
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    privateKeyBuffer
  )
  
  const encryptedArray = new Uint8Array(encrypted)
  const combined = new Uint8Array(iv.length + encryptedArray.length)
  combined.set(iv, 0)
  combined.set(encryptedArray, iv.length)
  
  const result = arrayBufferToBase64(combined.buffer)
  const saltB64 = arrayBufferToBase64(salt.buffer)
  
  console.log('加密结果 (base64):', result.substring(0, 50) + '...')
  console.log('Salt (base64):', saltB64.substring(0, 50) + '...')
  
  return {
    encrypted_private_key: result,
    private_key_salt: saltB64
  }
}

export async function decryptPrivateKey(encryptedPrivateKey, password, saltB64) {
  try {
    console.log('=== 解密私钥 ===')
    console.log('密码长度:', password.length)
    console.log('密码:', password)
    console.log('加密数据 (base64):', encryptedPrivateKey.substring(0, 50) + '...')
    console.log('Salt (base64):', saltB64.substring(0, 50) + '...')
    
    const combined = base64ToArrayBuffer(encryptedPrivateKey)
    const combinedArray = new Uint8Array(combined)
    
    console.log('解析后的数据长度:', combinedArray.length)
    console.log('解析后的数据 (hex):', arrayBufferToHex(combined).substring(0, 100) + '...')
    
    const iv = combinedArray.slice(0, 12)
    const ciphertext = combinedArray.slice(12)
    
    console.log('IV (hex):', arrayBufferToHex(iv))
    console.log('密文长度:', ciphertext.length)
    console.log('密文 (hex):', arrayBufferToHex(ciphertext).substring(0, 100) + '...')
    
    const passwordBuffer = new TextEncoder().encode(password)
    
    const salt = new Uint8Array(base64ToArrayBuffer(saltB64))
    console.log('使用 salt (hex):', arrayBufferToHex(salt))
    
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    )
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    )
    
    console.log('解密后数据长度:', decrypted.byteLength)
    console.log('解密后数据 (hex):', arrayBufferToHex(decrypted).substring(0, 100) + '...')
    
    const result = new TextDecoder().decode(decrypted)
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
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16)
    const encryptedData = CryptoJS.lib.WordArray.create(combined.words.slice(4), combined.sigBytes - 16)
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
