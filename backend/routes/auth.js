const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

// 显式加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '991218aa',
  database: process.env.MYSQL_DATABASE || 'courseweaver',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 从users表中验证用户名和密码
    const [rows] = await pool.execute(
      'SELECT id, username FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 密码验证通过，返回用户信息
    res.json({
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 注册接口
router.post('/signup', async (req, res) => {
  try {
    const { username, password, fullName, organization, phone } = req.body;

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 创建新用户
    const userId = uuidv4();
    await pool.execute(
      'INSERT INTO users (id, username, password, full_name, organization, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, password, fullName, organization, phone]
    );

    // 返回新创建的用户信息
    res.status(201).json({
      user: {
        id: userId,
        username: username
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 获取用户课程列表
router.get('/courses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 查询用户有权限访问的课程
    const [courses] = await pool.execute(`
      SELECT c.id, c.name, c.description, c.cover_image 
      FROM courses c 
      JOIN course_permissions cp ON c.id = cp.course_id 
      WHERE cp.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);
    
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: '获取课程列表失败' });
  }
});

// 获取特定课程详情
router.get('/courses/:userId/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    
    // 验证用户是否有权限访问该课程
    const [permission] = await pool.execute(
      'SELECT id FROM course_permissions WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (permission.length === 0) {
      return res.status(403).json({ error: '无权访问该课程' });
    }
    
    // 获取课程详情
    const [courses] = await pool.execute(
      'SELECT id, name, description, cover_image FROM courses WHERE id = ?',
      [courseId]
    );
    
    if (courses.length === 0) {
      return res.status(404).json({ error: '课程未找到' });
    }
    
    // 获取课程资源
    const [resources] = await pool.execute(
      'SELECT id, name as title, type as resource_type, file_path FROM course_resources WHERE course_id = ? ORDER BY order_index',
      [courseId]
    );
    
    res.json({
      course: courses[0],
      resources
    });
  } catch (error) {
    console.error('Get course detail error:', error);
    res.status(500).json({ error: '获取课程详情失败' });
  }
});

module.exports = router;