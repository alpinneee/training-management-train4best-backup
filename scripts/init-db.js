const mysql = require('mysql2/promise');

async function main() {
  try {
    console.log('Attempting to connect to MySQL...');
    // Create connection to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    console.log('Creating database if it does not exist...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS train4best');
    console.log('Database train4best created or already exists');

    // Switch to the train4best database
    await connection.changeUser({ database: 'train4best' });

    // Create tables based on the Prisma schema
    console.log('Creating tables...');
    
    // UserType table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS usertype (
        id VARCHAR(255) PRIMARY KEY,
        usertype VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(255) DEFAULT 'Active'
      )
    `);
    console.log('UserType table created');

    // Instructure table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS instructure (
        id VARCHAR(255) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        photo VARCHAR(255),
        phone_number VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        profiency VARCHAR(255) NOT NULL
      )
    `);
    console.log('Instructure table created');

    // User table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        instructureId VARCHAR(255),
        last_login DATETIME,
        token VARCHAR(255),
        userTypeId VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        FOREIGN KEY (instructureId) REFERENCES instructure(id),
        FOREIGN KEY (userTypeId) REFERENCES usertype(id)
      )
    `);
    console.log('User table created');

    // Participant table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS participant (
        id VARCHAR(255) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        photo VARCHAR(255),
        address TEXT NOT NULL,
        phone_number VARCHAR(255) NOT NULL,
        birth_date DATETIME NOT NULL,
        job_title VARCHAR(255),
        company VARCHAR(255),
        gender VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id)
      )
    `);
    console.log('Participant table created');

    // CourseType table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS coursetype (
        id VARCHAR(255) PRIMARY KEY,
        course_type VARCHAR(255) NOT NULL
      )
    `);
    console.log('CourseType table created');

    // Course table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS course (
        id VARCHAR(255) PRIMARY KEY,
        courseTypeId VARCHAR(255) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        FOREIGN KEY (courseTypeId) REFERENCES coursetype(id)
      )
    `);
    console.log('Course table created');

    // Class table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS class (
        id VARCHAR(255) PRIMARY KEY,
        quota INT NOT NULL,
        price FLOAT NOT NULL,
        status VARCHAR(255) NOT NULL,
        start_reg_date DATETIME NOT NULL,
        end_reg_date DATETIME NOT NULL,
        duration_day INT NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        room VARCHAR(255) NOT NULL,
        courseId VARCHAR(255) NOT NULL,
        FOREIGN KEY (courseId) REFERENCES course(id)
      )
    `);
    console.log('Class table created');

    // Insert some initial data
    console.log('Inserting initial data...');

    // Insert user types
    await connection.execute(`
      INSERT IGNORE INTO usertype (id, usertype, description, status)
      VALUES 
        ('usertype_1', 'Admin', 'Administrator with full access', 'Active'),
        ('usertype_2', 'Participant', 'Course participant', 'Active'),
        ('usertype_3', 'Instructure', 'Course instructor', 'Active')
    `);
    console.log('UserType data inserted');

    // Insert course types
    await connection.execute(`
      INSERT IGNORE INTO coursetype (id, course_type)
      VALUES 
        ('coursetype_1', 'Technical'),
        ('coursetype_2', 'Non-Technical'),
        ('coursetype_3', 'Certification')
    `);
    console.log('CourseType data inserted');

    // Insert courses
    await connection.execute(`
      INSERT IGNORE INTO course (id, courseTypeId, course_name)
      VALUES 
        ('course_1', 'coursetype_1', 'AIoT'),
        ('course_2', 'coursetype_1', 'Programmer'),
        ('course_3', 'coursetype_2', 'Leadership'),
        ('course_4', 'coursetype_3', 'AWS Certification')
    `);
    console.log('Course data inserted');
    
    console.log('Database initialization completed successfully!');
    await connection.end();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main() 