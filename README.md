# 数字家 - 零知识加密的家庭记录应用

基于 UniApp 开发的跨平台家庭记录应用，采用零知识加密技术保护用户隐私。

## 功能特性

### 用户认证
- 用户注册与登录
- RSA 密钥对自动生成
- 公钥加密，私钥解密
- 本地安全存储密钥

### 家庭管理
- 创建家庭
- 切换家庭
- 家庭成员邀请
- 家庭密钥加密存储

### 里程碑记录
- 创建家庭里程碑
- 查看里程碑列表
- AES 加密内容存储
- 时间轴展示

### 待办事项
- 创建家庭待办事项
- 卡片式展示待办列表
- 标记完成并自动隐藏
- 标题必填，描述可选
- AES 加密存储

### 家庭成员
- 查看家庭成员列表
- 显示成员头像、用户名、手机号（脱敏）
- 区分户主和普通成员角色
- 户主可邀请新成员
- 手机号脱敏显示（如：138****8000）

### 隐私保护
- 零知识加密架构
- 客户端加密，服务器无法解密
- RSA + AES 双重加密
- 密钥本地存储

## 技术栈

- **框架**: UniApp
- **前端**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **加密**: CryptoJS, JSEncrypt
- **日期处理**: Day.js
- **网络请求**: UniApp Request API

## 项目结构

```
digital_home_uniapp/
├── pages/                    # 页面目录
│   ├── auth/                # 认证相关页面
│   │   ├── register.vue    # 注册页
│   │   └── login.vue       # 登录页
│   ├── index/               # 首页
│   │   └── index.vue       # 里程碑列表
│   ├── create/              # 创建页面
│   │   └── create.vue      # 创建里程碑
│   ├── todo/                # 待办事项页面
│   │   └── todo.vue        # 待办事项列表
│   ├── members/             # 家庭成员页面
│   │   └── members.vue    # 成员列表
│   └── family/              # 家庭管理页面
│       ├── create.vue      # 创建家庭
│       └── invite.vue      # 切换家庭
├── src/                     # 源代码目录
│   ├── api/                # API 服务
│   │   ├── auth.js         # 认证 API
│   │   ├── family.js       # 家庭 API
│   │   ├── milestone.js    # 里程碑 API
│   │   └── todo.js         # 待办事项 API
│   ├── stores/             # Pinia 状态管理
│   │   ├── user.js         # 用户状态
│   │   └── family.js       # 家庭状态
│   └── utils/              # 工具函数
│       ├── crypto.js       # 加密工具
│       ├── request.js      # 网络请求
│       └── storage.js      # 本地存储
├── static/                  # 静态资源
├── App.vue                  # 应用入口
├── main.js                  # 主文件
├── pages.json              # 页面配置
├── manifest.json           # 应用配置
└── package.json            # 项目配置
```

## 安装步骤

### 环境要求
- Node.js >= 14.0.0
- npm 或 yarn
- HBuilderX 或 Vue CLI

### 安装依赖

```bash
npm install
```

## 运行项目

### 开发模式

使用 HBuilderX：
1. 打开 HBuilderX
2. 导入项目目录
3. 点击运行 -> 运行到浏览器/模拟器

使用命令行：
```bash
npm run dev:h5          # 运行到浏览器
npm run dev:mp-weixin   # 运行到微信小程序
```

### 生产构建

```bash
npm run build:h5          # 构建为 H5
npm run build:mp-weixin   # 构建为微信小程序
```

## 核心功能说明

### 加密机制

1. **用户注册时**
   - 生成 RSA 密钥对（公钥、私钥）
   - 公钥上传到服务器
   - 私钥本地加密存储

2. **创建家庭时**
   - 生成 AES 家庭密钥
   - 使用用户公钥加密家庭密钥
   - 加密后的密钥上传到服务器

3. **创建里程碑时**
   - 使用家庭 AES 密钥加密内容
   - 加密后的内容上传到服务器

4. **查看里程碑时**
   - 从服务器获取加密内容
   - 使用本地私钥解密家庭密钥
   - 使用家庭密钥解密里程碑内容

5. **创建待办事项时**
   - 使用家庭 AES 密钥加密标题和描述
   - 加密后的内容上传到服务器

6. **查看待办事项时**
   - 从服务器获取加密内容
   - 使用家庭密钥解密标题和描述
   - 过滤掉已完成的待办事项

7. **查看家庭成员时**
   - 调用 `GET /family/{family_id}/members` 获取成员列表
   - 显示成员头像、用户名、手机号（脱敏）、角色（直接显示角色字段）
   - 男主人/女主人角色用红色标识，其他角色用紫色标识

8. **邀请新成员时（仅男主人/女主人）**
   - 输入目标用户手机号
   - 选择角色（儿子/女儿/爸爸/妈妈/岳父/岳母）
   - 调用 `GET /auth/public-key?phone={phone}` 获取目标用户公钥
   - 使用家庭密钥加密家庭密钥，得到 `encrypted_key_for_target`
   - 调用 `POST /family/member` 发送邀请请求 `{ family_id, target_phone, encrypted_key_for_target, role }`
   - 成功后刷新成员列表

### 状态管理

使用 Pinia 管理应用状态：

- **User Store**: 用户认证状态、密钥管理
- **Family Store**: 家庭信息、家庭成员、家庭密钥

### API 服务

模块化的 API 服务封装：

- **Auth API**: 注册、登录、获取用户信息
- **Family API**: 创建家庭、获取家庭列表、切换家庭、获取成员列表、邀请成员
- **Milestone API**: 创建里程碑、获取里程碑列表
- **Todo API**: 创建待办事项、获取待办列表、更新待办状态、删除待办事项

## 配置说明

### API 基础地址

在 `src/utils/request.js` 中配置 API 基础地址：

```javascript
const BASE_URL = 'https://your-api-domain.com/api'
```

### 应用配置

在 `manifest.json` 中配置应用信息：

- 应用名称
- 应用图标
- 版本号
- 权限配置

### 页面配置

在 `pages.json` 中配置页面路由和样式：

- 页面路径
- 导航栏样式
- 窗口样式
- TabBar 配置（大事记、家庭成员、待办事项）

## 安全注意事项

1. **密钥安全**
   - 私钥必须本地加密存储
   - 不要将私钥上传到服务器
   - 定期更换密钥

2. **数据传输**
   - 使用 HTTPS 协议
   - 敏感数据必须加密传输

3. **本地存储**
   - 使用 uni.storage 加密存储敏感数据
   - 不要在 localStorage 中存储明文密钥

## 开发规范

### 代码风格

- 使用 Vue 3 Composition API
- 使用 `<script setup>` 语法
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case

### Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 常见问题

### Q: 如何切换到其他平台？

A: 修改 pages.json 和 manifest.json 中的平台配置，然后运行对应的构建命令。

### Q: 如何自定义加密算法？

A: 修改 src/utils/crypto.js 中的加密函数实现。

### Q: 如何添加新的页面？

A: 在 pages 目录下创建新页面，然后在 pages.json 中注册路由。

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。
