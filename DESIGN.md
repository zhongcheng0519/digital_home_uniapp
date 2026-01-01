# 数字家 (Digital Home) 前端开发上下文文档 (MVP)

## 1. 项目概况

我们要开发“数字家”移动端 APP，使用 **UniApp (Vue 3)** 技术栈。

* **发布平台：** iOS / Android App (通过 HBuilderX 打包)。
* **核心理念：** **本地优先加密 (Local-First Encryption)**。数据在离开手机前必须被加密，服务器对内容一无所知。
* **后端支持：** Python FastAPI (已完成设计，假设运行在本地 `http://127.0.0.1:8000`)。

## 2. 技术栈与依赖

请使用以下具体库，并确保它们兼容 UniApp 的 JS 运行环境：

* **框架核心：** UniApp (Vue 3 Composition API + `<script setup>`)。
* **网络请求：** `uni.request` 的封装（需要拦截器处理 JWT Token）。
* **状态管理：** `Pinia` (用于存储用户状态和**内存中的解密密钥**)。
* **加解密核心 (关键)：**
* `crypto-js`: 用于 AES (对称加密) 和 PBKDF2 (密钥派生)。
* `jsencrypt`: 用于 RSA (非对称加密) 的密钥生成和加解密。


* **UI 组件库：** `uni-ui` (官方库) 或原生 CSS。
* **日期处理：** `dayjs`。

## 3. 项目目录结构建议

请按此结构初始化项目：

```text
frontend/
├── src/
│   ├── api/                 # 后端接口定义
│   │   ├── auth.js
│   │   ├── family.js
│   │   ├── milestone.js
│   │   └── todo.js
│   ├── utils/
│   │   ├── request.js       # 封装 uni.request (带拦截器)
│   │   ├── crypto.js        # 【核心】所有加解密逻辑封装
│   │   └── storage.js       # 封装 uni.setStorageSync
│   ├── stores/              # Pinia 状态管理
│   │   ├── user.js          # 存用户信息、私钥(明文)
│   │   └── family.js        # 存当前家庭信息、家庭密钥(明文)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.vue
│   │   │   └── register.vue
│   │   ├── index/
│   │   │   └── index.vue    # 首页：大事记时间轴
│   │   ├── create/
│   │   │   └── create.vue   # 发布新大事记
│   │   ├── todo/
│   │   │   └── todo.vue     # 待办事项列表
│   │   └── family/
│   │       ├── create.vue   # 创建新家庭
│   │       └── invite.vue   # 显示邀请信息
│   ├── App.vue
│   ├── main.js
│   └── manifest.json

```

## 4. 加密逻辑规范 (Brain)

**文件位置：** `src/utils/crypto.js`
这是整个 APP 安全性的基石，请严格实现以下函数：

1. **`generateRSAKeyPair()`**:
* 功能：生成 RSA 公私钥对。
* 用途：注册时调用。
* 返回：`{ publicKey, privateKey }` (PEM 格式字符串)。


2. **`encryptPrivateKey(privateKey, password)`**:
* 功能：用用户的登录密码（作为对称密钥）加密他的 RSA 私钥。
* 算法：AES。
* 用途：注册时，将加密后的私钥传给服务器备份。


3. **`decryptPrivateKey(encryptedPrivateKey, password)`**:
* 功能：上述过程的逆过程。
* 用途：登录成功后，用密码解开服务器返回的私钥密文。


4. **`encryptData(text, aesKey)`**:
* 功能：加密业务数据（如大事记内容）。
* 算法：AES-GCM 或 AES-CBC。


5. **`decryptData(ciphertext, aesKey)`**:
* 功能：解密业务数据。


6. **`encryptKeyWithRSA(aesKey, userPublicKey)`**:
* 功能：用目标用户的公钥，加密“家庭密钥”。
* 用途：邀请家人加入时使用。



## 5. 状态管理 (Pinia Store)

### `stores/user.js`

* **State:**
* `token`: JWT 字符串。
* `userInfo`: 对象，包含 `{ id, phone, username, publicKey }`。
* `myPrivateKey`: **字符串 (PEM)**。
* *注意：这是解密后的真私钥，仅存在于内存中，严禁写入 LocalStorage，严禁 console.log。*




* **Actions:**
* `login(phone, password)`:
1. 调用 API 登录，获取 `token` 和 `encrypted_private_key`。
2. 调用 `crypto.decryptPrivateKey(key, password)`。
3. 如果解密成功，将私钥存入 State；否则提示“密码错误或解密失败”。





### `stores/family.js`

* **State:**
* `currentFamily`: 对象 `{ id, name, owner_id }`。
* `currentFamilyKey`: **字符串**。
* *注意：这是解密后的家庭 AES 密钥，仅存在于内存中。*




* **Actions:**
* `unlockFamily(encryptedFamilyKey)`:
1. 使用 `userStore.myPrivateKey` 解密传入的 `encryptedFamilyKey`。
2. 将解出的 Key 存入 `currentFamilyKey`。





## 6. 核心页面功能流程

### 6.1 注册页面 (`pages/auth/register.vue`)

1. **输入：** 手机号、用户名、密码。
2. **流程：**
* 前端生成 RSA 密钥对 (`Pub`, `Priv`)。
* 前端用密码加密 `Priv` -> 得到 `Enc_Priv`。
* 发送 API 请求：`phone`, `username`, `password` (Hash), `Pub`, `Enc_Priv`。



### 6.2 登录页面 (`pages/auth/login.vue`)

1. **输入：** 手机号、密码。
2. **流程：**
* 发送 API：`phone`, `password`。
* 后端返回：`token` 和 `encrypted_private_key`。
* **本地解密：** 再次使用用户输入的密码，尝试解密私钥。
* **成功：** 存入 Pinia，跳转首页。
* **失败：** 报错（说明密码虽然能通过服务器登录验证，但解不开私钥，这通常发生在用户修改了密码但没重置私钥的情况，MVP暂不考虑）。



### 6.3 首页/大事记 (`pages/index/index.vue`)

1. **加载时：**
* 调用 `GET /family/my`。
* 拿到 `encrypted_family_key`。
* 调用 Store 方法，用**我的私钥**解密它，得到真正的**家庭密钥**。
* 调用 `GET /milestone` 获取大事记列表（此时内容全是密文）。
* **渲染循环：** 遍历列表，实时用**家庭密钥**解密 `content_ciphertext`。
* 显示：日期（明文） + 内容（解密后的明文）。



### 6.4 发布大事记 (`pages/create/create.vue`)

1. **UI：** 日期选择器（默认今天），多行文本框。
2. **提交：**
* 获取 Pinia 中的 `currentFamilyKey`。
* 加密文本框内容 -> 得到密文。
* 调用 API 发送：`{ event_date, content_ciphertext }`。
* 返回首页刷新。



### 6.5 创建家庭 (`pages/family/create.vue`)

1. **UI：** 输入"家庭名称"。
2. **流程：**
* 生成一个随机字符串作为 `FamilyKey` (AES)。
* 用**我自己的公钥**加密这个 `FamilyKey`。
* 发送 API：`{ name, encrypted_family_key }`。

### 6.6 待办事项 (`pages/todo/todo.vue`)

1. **UI：**
* TabBar 导航到"待办事项"页面
* 卡片式展示待办事项列表
* 每个卡片包含：标题、描述（可选）、创建者、创建时间
* 右侧有完成按钮（圆圈图标）

2. **创建待办事项：**
* 点击"+ 新建"按钮，弹出模态框
* 输入标题（必填）和描述（可选）
* 使用**家庭密钥**加密标题和描述
* 调用 API：`POST /todo/` 发送 `{ family_id, title_ciphertext, description_ciphertext }`

3. **查看待办事项：**
* 调用 `GET /todo/` 获取待办事项列表
* 过滤掉已完成的待办事项（`is_completed: true`）
* 使用**家庭密钥**解密 `title_ciphertext` 和 `description_ciphertext`
* 以卡片形式展示

4. **标记完成：**
* 点击卡片右侧的完成按钮
* 使用**家庭密钥**加密当前的标题和描述
* 调用 API：`PUT /todo/{id}` 发送 `{ title_ciphertext, description_ciphertext, is_completed: true }`
* 成功后刷新列表，已完成的待办事项自动隐藏



## 7. 给 AI 的实现指令

请按以下步骤帮我生成代码：

1. **依赖安装：** 给出 `npm install` 命令。
2. **工具类优先：** 首先编写 `src/utils/crypto.js`，这是最复杂的算法部分，请务必保证正确性。
3. **状态管理：** 编写 Pinia Stores，重点是处理解密逻辑。
4. **网络层：** 编写 `request.js`，配置好 BaseURL。
5. **页面实现：** 按照 注册 -> 登录 -> 首页列表 -> 发布 的顺序实现页面 UI 和逻辑。
