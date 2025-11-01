-- 创建数据库
CREATE DATABASE IF NOT EXISTS courseweaver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE courseweaver;

-- 删除外键约束并删除现有表（如果存在）
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS course_resources;
DROP TABLE IF EXISTS course_permissions;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 创建用户表（使用自增ID）
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  organization VARCHAR(255),
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建课程表（使用自增ID）
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建课程权限表（使用自增ID）
CREATE TABLE course_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_course (user_id, course_id)
);

-- 创建课程资源表（使用自增ID）
CREATE TABLE course_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('video', 'ppt', 'pdf') NOT NULL,
  file_url VARCHAR(512) NOT NULL,
  file_path VARCHAR(512),
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 插入示例数据

-- 插入用户数据
INSERT INTO users (username, full_name, organization, phone, password) VALUES
( 'admin', '系统管理员', '长藤科技', '13800138000', 'admin123'),
( 'zhangwei', '张伟', '长藤科技', '13900139000', 'zhangwei123'),
( 'liuna', '刘娜', '长藤科技', '13700137000', 'liuna123');

-- 插入课程数据（全部为编程相关课程）
INSERT INTO courses (name, description, cover_image) VALUES
( 'JavaScript基础教程', '从零开始学习JavaScript编程语言，掌握基本语法和概念', '/images/js_course.jpg'),
( 'React开发实战', '深入学习React框架，构建现代化的前端应用程序', '/images/react_course.jpg'),
( 'Python数据分析', '使用Python进行数据处理和分析，掌握pandas和numpy库', '/images/python_course.jpg');

-- 插入课程权限数据
INSERT INTO course_permissions (user_id, course_id) VALUES
( 1, 1),  -- 管理员有权访问课程1
( 1, 2),  -- 管理员有权访问课程2
( 1, 3),  -- 管理员有权访问课程3
( 2, 1),  -- 张伟有权访问课程1
( 2, 3),  -- 张伟有权访问课程3
( 3, 2);  -- 刘娜有权访问课程2

-- 插入课程资源数据
INSERT INTO course_resources (course_id, name, type, file_url, file_path, order_index) VALUES
( 1, 'JavaScript变量和数据类型', 'video', '/videos/js_variables.mp4', '/videos/js_variables.mp4', 1),
( 1, 'JavaScript函数详解', 'pdf', '/documents/js_functions.pdf', '/documents/js_functions.pdf', 2),
( 2, 'React组件设计', 'video', '/videos/react_components.mp4', '/videos/react_components.mp4', 1),
( 2, 'React状态管理PPT', 'ppt', '/documents/react_state.pptx', '/documents/react_state.pptx', 2),
( 3, 'Python数据清洗技巧', 'pdf', '/documents/python_data_cleaning.pdf', '/documents/python_data_cleaning.pdf', 1),
( 3, 'NumPy数组操作', 'video', '/videos/numpy_arrays.mp4', '/videos/numpy_arrays.mp4', 2);