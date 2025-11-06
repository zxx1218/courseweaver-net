const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const BACK_PORT = process.env.BACK_PORT; //启动端口
const BACK_HOST = process.env.BACK_HOST; // 启动地址

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: 'CourseWeaver Backend API' });
});

app.listen(BACK_PORT, BACK_HOST, () => {
  console.log(`Server is running on ${BACK_HOST}:${BACK_PORT}`);
});