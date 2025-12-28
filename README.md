# 小学生趣味学习平台

一个专为小学生设计的趣味学习平台，通过游戏化的方式帮助孩子学习数学、语文等知识。

## 功能特点

- **数学练习**：20以内加减法、乘法表、除法、应用题等
- **拼音练习**：易混淆韵母辨析（ing/in、an/ang、en/eng 等）
- **仿写句子**：比喻句、拟人句、因果句等句式练习
- **阅读乐园**：精选儿童读物，培养阅读习惯
- **农场游戏**：种植收获，寓教于乐
- **金币奖励**：答题获得金币，激励学习

## 技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **动画**：Framer Motion
- **数据库**：SQLite (better-sqlite3)
- **状态管理**：Zustand
- **音效**：Howler.js

## 本地开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
npm run build
```

---

## Linux 服务器部署（PM2）

### 1. 服务器环境准备

#### 安装 Node.js（推荐使用 nvm）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新加载配置
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node -v
npm -v
```

#### 安装 PM2

```bash
npm install -g pm2
```

#### 安装编译工具（better-sqlite3 需要）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y build-essential python3

# CentOS/RHEL
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3
```

### 2. 部署项目

#### 上传代码到服务器

```bash
# 方式一：Git 克隆
git clone <your-repo-url> /var/www/edu-game
cd /var/www/edu-game

# 方式二：使用 scp 上传
scp -r ./project-folder user@server:/var/www/edu-game
```

#### 安装依赖并构建

```bash
cd /var/www/edu-game

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 3. PM2 配置

#### 创建 PM2 配置文件

在项目根目录创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'edu-game',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/edu-game',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

#### 启动应用

```bash
# 使用配置文件启动
pm2 start ecosystem.config.js

# 或直接启动
pm2 start npm --name "edu-game" -- start
```

#### PM2 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs edu-game

# 实时监控
pm2 monit

# 重启应用
pm2 restart edu-game

# 停止应用
pm2 stop edu-game

# 删除应用
pm2 delete edu-game

# 查看详细信息
pm2 show edu-game
```

#### 设置开机自启

```bash
# 生成启动脚本
pm2 startup

# 按照提示执行输出的命令，例如：
# sudo env PATH=$PATH:/home/user/.nvm/versions/node/v18.x.x/bin pm2 startup systemd -u user --hp /home/user

# 保存当前进程列表
pm2 save
```

### 4. Caddy 反向代理（推荐，最轻量）

Caddy 比 Nginx 更轻量，配置极简，**自动申请和续期 HTTPS 证书**。

#### 安装 Caddy

```bash
# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### 配置 Caddy

编辑 `/etc/caddy/Caddyfile`：

```
study.201861.xyz {
    reverse_proxy localhost:3000
}
```

就这么简单！Caddy 会自动申请 Let's Encrypt 证书。

#### 启动 Caddy

```bash
sudo systemctl restart caddy
sudo systemctl enable caddy
```

#### 验证

```bash
# 查看状态
sudo systemctl status caddy

# 查看日志
sudo journalctl -u caddy -f
```

### 5. 防火墙配置

```bash
# Ubuntu (ufw)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 更新部署

当有代码更新时：

```bash
cd /var/www/edu-game

# 拉取最新代码
git pull

# 安装新依赖（如果有）
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart edu-game
```

## 常见问题

### 1. better-sqlite3 编译失败

确保安装了编译工具：

```bash
sudo apt install -y build-essential python3
npm rebuild better-sqlite3
```

### 2. 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 3. PM2 内存不足

修改 `ecosystem.config.js` 中的 `max_memory_restart` 参数，或增加服务器内存。

### 4. 数据库权限问题

确保数据库文件有正确的读写权限：

```bash
chmod 664 /var/www/edu-game/data/game.db
chown www-data:www-data /var/www/edu-game/data/game.db
```

## 目录结构

```
├── app/                  # Next.js App Router
│   ├── api/             # API 路由
│   ├── components/      # 公共组件
│   ├── farm/            # 农场游戏
│   ├── school/          # 学习中心
│   ├── hooks/           # 自定义 Hooks
│   └── lib/             # 工具函数
├── data/                # SQLite 数据库
├── public/              # 静态资源
│   └── audio/           # 音效文件
├── ecosystem.config.js  # PM2 配置
└── package.json
```

## License

MIT
