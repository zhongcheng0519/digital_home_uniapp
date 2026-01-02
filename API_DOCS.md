# Digital Home API 文档

## 项目概要

Digital Home 是一个基于 FastAPI 的数字家庭后端服务，实现了零知识端到端加密的数据存储方案。

### 技术栈

- **框架**: FastAPI 0.104.0+
- **数据库**: PostgreSQL (通过 asyncpg)
- **ORM**: SQLModel
- **认证**: JWT (python-jose) + bcrypt
- **加密**: 零知识端到端加密（客户端加密，服务端只存储密文）

### 核心特性

1. **零知识加密**: 所有敏感数据在客户端加密，服务端无法解密
2. **家庭管理**: 支持创建家庭、添加成员、权限管理
3. **里程碑记录**: 记录家庭重要时刻，支持按年份筛选
4. **JWT 认证**: 基于 Token 的身份验证

### 数据模型

#### User (用户)
- `id`: 用户ID
- `phone`: 手机号（唯一）
- `username`: 用户名
- `hashed_password`: 加密密码
- `public_key`: 公钥（用于加密）
- `encrypted_private_key`: 加密的私钥
- `private_key_salt`: 私钥加密使用的盐值

#### Family (家庭)
- `id`: 家庭ID
- `name`: 家庭名称
- `owner_id`: 家庭拥有者ID

#### FamilyMember (家庭成员)
- `family_id`: 家庭ID
- `user_id`: 用户ID
- `role`: 角色（owner/member）
- `encrypted_family_key`: 加密的家庭密钥

#### Milestone (里程碑)
- `id`: 里程碑ID
- `family_id`: 家庭ID
- `creator_id`: 创建者ID
- `event_date`: 事件日期
- `content_ciphertext`: 内容密文
- `created_at`: 创建时间

#### Todo (待办事项)
- `id`: 待办事项ID
- `family_id`: 家庭ID
- `creator_id`: 创建者ID
- `title_ciphertext`: 标题密文
- `description_ciphertext`: 描述密文（可选）
- `is_completed`: 是否完成
- `created_at`: 创建时间
- `updated_at`: 更新时间

---

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:8000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

---

## 认证模块 (Auth)

### 1. 用户注册

**接口**: `POST /api/v1/auth/register`

**请求参数**:
```json
{
  "phone": "13800138000",
  "username": "张三",
  "password": "password123",
  "public_key": "-----BEGIN PUBLIC KEY-----...",
  "encrypted_private_key": "encrypted_base64_string",
  "private_key_salt": "salt_base64_string"
}
```

**响应**:
```json
{
  "id": 1,
  "phone": "13800138000",
  "username": "张三",
  "public_key": "-----BEGIN PUBLIC KEY-----...",
  "encrypted_private_key": "encrypted_base64_string",
  "private_key_salt": "salt_base64_string"
}
```

**错误响应**:
- `400 Bad Request`: 手机号已注册

---

### 2. 用户登录

**接口**: `POST /api/v1/auth/login`

**请求参数**:
```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_info": {
    "id": 1,
    "phone": "13800138000",
    "username": "张三",
    "public_key": "-----BEGIN PUBLIC KEY-----...",
    "encrypted_private_key": "encrypted_base64_string",
    "private_key_salt": "salt_base64_string"
  }
}
```

**错误响应**:
- `401 Unauthorized`: 手机号或密码错误

**使用 Token**: 在后续请求的 Header 中添加 `Authorization: Bearer {access_token}`

---

### 3. 获取用户公钥

**接口**: `GET /api/v1/auth/public-key`

**需要认证**: 否

**查询参数**:
- `phone` (必填): 用户手机号

**请求示例**:
```
GET /api/v1/auth/public-key?phone=13800138000
```

**响应**:
```json
{
  "public_key": "-----BEGIN PUBLIC KEY-----..."
}
```

**错误响应**:
- `404 Not Found`: 用户不存在

**说明**: 
- 此接口不需要身份认证
- 公钥是公开信息，可以自由获取
- 用于添加家庭成员时获取目标用户的公钥，以便加密家庭密钥

---

### 4. 获取用户名

**接口**: `GET /api/v1/auth/username`

**需要认证**: 否

**查询参数**:
- `user_id` (必填): 用户ID

**请求示例**:
```
GET /api/v1/auth/username?user_id=1
```

**响应**:
```json
{
  "username": "张三"
}
```

**错误响应**:
- `404 Not Found`: 用户不存在

**说明**: 
- 此接口不需要身份认证
- 用户名是公开信息，可以自由获取
- 用于显示创建者信息等场景

---

## 家庭模块 (Family)

### 1. 创建家庭

**接口**: `POST /api/v1/family/`

**需要认证**: 是

**请求参数**:
```json
{
  "name": "我的家庭",
  "encrypted_family_key": "encrypted_family_key_base64"
}
```

**响应**:
```json
{
  "id": 1,
  "name": "我的家庭",
  "owner_id": 1
}
```

**说明**: 
- `encrypted_family_key` 是用创建者的公钥加密的家庭密钥
- 创建者自动成为家庭拥有者（owner）

---

### 2. 添加家庭成员

**接口**: `POST /api/v1/family/member`

**需要认证**: 是

**权限**: 仅家庭拥有者可操作

**请求参数**:
```json
{
  "family_id": 1,
  "target_phone": "13900139000",
  "encrypted_key_for_target": "encrypted_key_for_target_base64"
}
```

**响应**:
```json
{
  "message": "Member added successfully"
}
```

**错误响应**:
- `403 Forbidden`: 非家庭拥有者
- `404 Not Found`: 家庭不存在或目标用户不存在
- `400 Bad Request`: 用户已是该家庭成员

**说明**: 
- `encrypted_key_for_target` 是用目标用户的公钥加密的家庭密钥
- 只有家庭拥有者可以添加成员

---

### 3. 获取我的家庭列表

**接口**: `GET /api/v1/family/my`

**需要认证**: 是

**响应**:
```json
[
  {
    "id": 1,
    "name": "我的家庭",
    "owner_id": 1,
    "role": "owner",
    "encrypted_family_key": "encrypted_key_base64"
  },
  {
    "id": 2,
    "name": "张三的家庭",
    "owner_id": 2,
    "role": "member",
    "encrypted_family_key": "encrypted_key_base64"
  }
]
```

**说明**: 返回当前用户所属的所有家庭，包含加密的家庭密钥

---

## 里程碑模块 (Milestone)

### 1. 创建里程碑

**接口**: `POST /api/v1/milestone/`

**需要认证**: 是

**权限**: 仅家庭成员可操作

**请求参数**:
```json
{
  "family_id": 1,
  "event_date": "2024-01-01",
  "content_ciphertext": "encrypted_content_base64"
}
```

**响应**:
```json
{
  "id": 1,
  "family_id": 1,
  "creator_id": 1,
  "event_date": "2024-01-01",
  "content_ciphertext": "encrypted_content_base64",
  "created_at": "2024-01-01T10:00:00"
}
```

**错误响应**:
- `403 Forbidden`: 不是该家庭成员

**说明**: 
- `event_date` 格式为 `YYYY-MM-DD`
- `content_ciphertext` 是用家庭密钥加密的内容密文

---

### 2. 获取里程碑列表

**接口**: `GET /api/v1/milestone/`

**需要认证**: 是

**权限**: 仅家庭成员可查看

**查询参数**:
- `family_id` (必填): 家庭ID
- `year` (可选): 筛选年份，如 `2024`

**请求示例**:
```
GET /api/v1/milestone/?family_id=1&year=2024
```

**响应**:
```json
[
  {
    "id": 2,
    "family_id": 1,
    "creator_id": 1,
    "event_date": "2024-06-15",
    "content_ciphertext": "encrypted_content_base64",
    "created_at": "2024-06-15T08:30:00"
  },
  {
    "id": 1,
    "family_id": 1,
    "creator_id": 2,
    "event_date": "2024-01-01",
    "content_ciphertext": "encrypted_content_base64",
    "created_at": "2024-01-01T10:00:00"
  }
]
```

**错误响应**:
- `403 Forbidden`: 不是该家庭成员

**说明**: 
- 结果按事件日期降序排列（最新的在前）
- 不传 `year` 参数则返回所有年份的里程碑

---

### 3. 更新里程碑

**接口**: `PUT /api/v1/milestone/{milestone_id}`

**需要认证**: 是

**权限**: 仅家庭成员可操作

**路径参数**:
- `milestone_id` (必填): 里程碑ID

**请求参数**:
```json
{
  "event_date": "2025-02-01",
  "content_ciphertext": "new_encrypted_content_base64"
}
```

**响应**:
```json
{
  "id": 1,
  "family_id": 1,
  "creator_id": 1,
  "event_date": "2025-02-01",
  "content_ciphertext": "new_encrypted_content_base64",
  "created_at": "2024-01-01T10:00:00"
}
```

**错误响应**:
- `403 Forbidden`: 不是该家庭成员
- `404 Not Found`: 里程碑不存在

**说明**: 
- 所有字段都是可选的，只更新提供的字段
- 任意家庭成员都可以更新里程碑

---

## 待办事项模块 (Todo)

### 1. 创建待办事项

**接口**: `POST /api/v1/todo/`

**需要认证**: 是

**权限**: 仅家庭成员可操作

**请求参数**:
```json
{
  "family_id": 1,
  "title_ciphertext": "encrypted_title_base64",
  "description_ciphertext": "encrypted_description_base64"
}
```

**响应**:
```json
{
  "id": 1,
  "family_id": 1,
  "creator_id": 1,
  "title_ciphertext": "encrypted_title_base64",
  "description_ciphertext": "encrypted_description_base64",
  "is_completed": false,
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T10:00:00"
}
```

**错误响应**:
- `403 Forbidden`: 不是该家庭成员

**说明**: 
- `title_ciphertext` 是用家庭密钥加密的标题密文
- `description_ciphertext` 是用家庭密钥加密的描述密文（可选）
- 任意家庭成员都可以创建待办事项

---

### 2. 获取待办事项列表

**接口**: `GET /api/v1/todo/`

**需要认证**: 是

**权限**: 仅家庭成员可查看

**查询参数**:
- `family_id` (必填): 家庭ID

**请求示例**:
```
GET /api/v1/todo/?family_id=1
```

**响应**:
```json
[
  {
    "id": 2,
    "family_id": 1,
    "creator_id": 2,
    "title_ciphertext": "encrypted_title_base64",
    "description_ciphertext": "encrypted_description_base64",
    "is_completed": false,
    "created_at": "2024-01-02T09:00:00",
    "updated_at": "2024-01-02T09:00:00"
  },
  {
    "id": 1,
    "family_id": 1,
    "creator_id": 1,
    "title_ciphertext": "encrypted_title_base64",
    "description_ciphertext": "encrypted_description_base64",
    "is_completed": true,
    "created_at": "2024-01-01T10:00:00",
    "updated_at": "2024-01-01T15:00:00"
  }
]
```

**错误响应**:
- `403 Forbidden`: 不是该家庭成员

**说明**: 
- 结果按创建时间降序排列（最新的在前）
- 返回该家庭的所有待办事项

---

### 3. 更新待办事项

**接口**: `PUT /api/v1/todo/{todo_id}`

**需要认证**: 是

**权限**: 仅家庭成员可操作

**路径参数**:
- `todo_id` (必填): 待办事项ID

**请求参数**:
```json
{
  "title_ciphertext": "new_encrypted_title_base64",
  "description_ciphertext": "new_encrypted_description_base64",
  "is_completed": true
}
```

**响应**:
```json
{
  "id": 1,
  "family_id": 1,
  "creator_id": 1,
  "title_ciphertext": "new_encrypted_title_base64",
  "description_ciphertext": "new_encrypted_description_base64",
  "is_completed": true,
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T15:00:00"
}
```

**错误响应**:
- `403 Forbidden`: 不是该家庭成员
- `404 Not Found`: 待办事项不存在

**说明**: 
- 所有字段都是可选的，只更新提供的字段
- 任意家庭成员都可以更新待办事项
- 更新操作会自动更新 `updated_at` 时间戳

---

### 4. 删除待办事项

**接口**: `DELETE /api/v1/todo/{todo_id}`

**需要认证**: 是

**权限**: 仅家庭成员可操作

**路径参数**:
- `todo_id` (必填): 待办事项ID

**请求示例**:
```
DELETE /api/v1/todo/1
```

**响应**:
```json
{
  "message": "Todo deleted successfully"
}
```

**错误响应**:
- `403 Forbidden`: 不是该家庭成员
- `404 Not Found`: 待办事项不存在

**说明**: 
- 任意家庭成员都可以删除待办事项

---

## 加密流程说明

### 注册流程

1. 前端生成 RSA 密钥对（公钥 + 私钥）
2. 使用 PBKDF2 从用户密码派生加密密钥（生成随机 salt）
3. 用派生密钥加密私钥，得到 `encrypted_private_key`
4. 发送注册请求，包含公钥、加密的私钥和 salt

### 创建家庭流程

1. 前端生成家庭密钥（随机字符串）
2. 用创建者的公钥加密家庭密钥，得到 `encrypted_family_key`
3. 发送创建家庭请求

### 添加成员流程

1. 调用 `GET /api/v1/auth/public-key?phone={target_phone}` 获取目标用户的公钥
2. 用目标用户的公钥加密家庭密钥，得到 `encrypted_key_for_target`
3. 发送添加成员请求

### 创建里程碑流程

1. 用家庭密钥加密里程碑内容，得到 `content_ciphertext`
2. 发送创建里程碑请求

### 更新里程碑流程

1. 用家庭密钥加密新的内容（如果更新），得到 `content_ciphertext`
2. 发送更新里程碑请求

### 创建待办事项流程

1. 用家庭密钥加密待办事项标题，得到 `title_ciphertext`
2. 用家庭密钥加密待办事项描述（如果有），得到 `description_ciphertext`
3. 发送创建待办事项请求

### 更新待办事项流程

1. 用家庭密钥加密新的标题（如果更新），得到 `title_ciphertext`
2. 用家庭密钥加密新的描述（如果更新），得到 `description_ciphertext`
3. 发送更新待办事项请求

### 解密流程

1. 从服务器获取 `encrypted_private_key` 和 `private_key_salt`
2. 使用相同的 PBKDF2 和 `private_key_salt` 从用户密码派生相同的密钥
3. 用派生密钥解密 `encrypted_private_key`，得到私钥
4. 用私钥解密 `encrypted_family_key`，得到家庭密钥
5. 用家庭密钥解密 `content_ciphertext`，得到原始内容

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误（如手机号已注册） |
| 401 | 未授权（Token 无效或过期） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |

---

## 开发环境配置

### 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/digital_home
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 启动服务

```bash
# 安装依赖
pip install -e .

# 运行服务
uvicorn app.main:app --reload
```

服务将在 `http://localhost:8000` 启动

### API 文档

启动服务后，访问：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 注意事项

1. **CORS 配置**: 当前允许所有来源，生产环境需限制
2. **加密安全**: 所有加密操作应在客户端完成，服务端不存储明文
3. **日期格式**: 所有日期使用 ISO 8601 格式（YYYY-MM-DD）
4. **密钥管理**: 私钥必须安全存储，建议使用浏览器安全存储
