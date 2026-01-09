# TabBar 图标说明

## 需要添加的图标文件

### 家庭成员图标

#### 1. members.png
- 路径: `static/tabbar/members.png`
- 尺寸: 200x200 像素
- 格式: PNG
- 颜色: 灰色（未选中状态）
- 建议: 使用用户/群组图标

#### 2. members-active.png
- 路径: `static/tabbar/members-active.png`
- 尺寸: 200x200 像素
- 格式: PNG
- 颜色: 紫色（#667eea，选中状态）
- 建议: 使用与 members.png 相同的图标，但颜色为紫色

### 便利贴图标

#### 3. note.png
- 路径: `static/tabbar/note.png`
- 尺寸: 200x200 像素
- 格式: PNG
- 颜色: 灰色（未选中状态）
- 建议: 使用便利贴/笔记图标

#### 4. note-active.png
- 路径: `static/tabbar/note-active.png`
- 尺寸: 200x200 像素
- 格式: PNG
- 颜色: 紫色（#667eea，选中状态）
- 建议: 使用与 note.png 相同的图标，但颜色为紫色

## 图标设计建议

可以使用以下图标设计：
- 家庭成员：用户图标（单个人像）、群组图标（多个人像）、家庭图标（房子 + 人）
- 便利贴：便利贴图标（带折角的矩形）、笔记图标（带线条的纸张）、文档图标

## 临时解决方案

如果暂时没有图标，可以复制现有的图标作为占位符：

```bash
# 复制待办事项图标作为家庭成员图标占位符
cp static/tabbar/todo.png static/tabbar/members.png
cp static/tabbar/todo-active.png static/tabbar/members-active.png

# 复制待办事项图标作为便利贴图标占位符
cp static/tabbar/todo.png static/tabbar/note.png
cp static/tabbar/todo-active.png static/tabbar/note-active.png
```

## 注意事项

- 图标必须是 PNG 或 JPG 格式
- 建议尺寸为 200x200 像素（与现有图标一致）
- 选中状态的颜色应与主题色保持一致（#667eea）
