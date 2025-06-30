const mysql = require('mysql2/promise');

async function main() {
  try {
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'train4best'
    });

    console.log('Connected successfully');
    
    // Get all courses
    const [courses] = await connection.execute('SELECT id FROM course');
    
    if (courses.length === 0) {
      console.log('No courses found');
      await connection.end();
      return;
    }
    
    console.log(`Found ${courses.length} courses, adding classes...`);
    
    // Delete existing classes for clean slate
    await connection.execute('DELETE FROM class');
    console.log('Deleted existing classes');
    
    // Current date
    const now = new Date();
    
    // Create future classes for each course
    for (const course of courses) {
      const courseId = course.id;
      
      // Create 3 different classes for each course with varying dates and prices
      
      // Class 1: Starting next month
      const startDate1 = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      const endDate1 = new Date(startDate1);
      endDate1.setDate(endDate1.getDate() + 7); // 7 day course
      
      const regStartDate1 = new Date(now); // Registration starts today
      const regEndDate1 = new Date(startDate1);
      regEndDate1.setDate(regEndDate1.getDate() - 2); // Ends 2 days before course
      
      await connection.execute(`
        INSERT INTO class (id, quota, price, status, start_reg_date, end_reg_date, 
          duration_day, start_date, end_date, location, room, courseId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `class_${courseId}_1_${Date.now()}`,
        20, // quota
        1500000, // price
        'Active',
        regStartDate1,
        regEndDate1,
        7, // duration
        startDate1,
        endDate1,
        'Jakarta',
        'Room A101',
        courseId
      ]);
      
      // Class 2: Starting in 2 months
      const startDate2 = new Date(now.getFullYear(), now.getMonth() + 2, 10);
      const endDate2 = new Date(startDate2);
      endDate2.setDate(endDate2.getDate() + 5); // 5 day course
      
      const regStartDate2 = new Date(now);
      const regEndDate2 = new Date(startDate2);
      regEndDate2.setDate(regEndDate2.getDate() - 5); // Ends 5 days before course
      
      await connection.execute(`
        INSERT INTO class (id, quota, price, status, start_reg_date, end_reg_date, 
          duration_day, start_date, end_date, location, room, courseId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `class_${courseId}_2_${Date.now() + 1}`,
        15, // quota
        1200000, // price
        'Active',
        regStartDate2,
        regEndDate2,
        5, // duration
        startDate2,
        endDate2,
        'Bandung',
        'Room B202',
        courseId
      ]);
      
      // Class 3: Online class starting in 3 months
      const startDate3 = new Date(now.getFullYear(), now.getMonth() + 3, 5);
      const endDate3 = new Date(startDate3);
      endDate3.setDate(endDate3.getDate() + 14); // 14 day course
      
      const regStartDate3 = new Date(now);
      const regEndDate3 = new Date(startDate3);
      regEndDate3.setDate(regEndDate3.getDate() - 3); // Ends 3 days before course
      
      await connection.execute(`
        INSERT INTO class (id, quota, price, status, start_reg_date, end_reg_date, 
          duration_day, start_date, end_date, location, room, courseId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `class_${courseId}_3_${Date.now() + 2}`,
        30, // quota
        2000000, // price
        'Active',
        regStartDate3,
        regEndDate3,
        14, // duration
        startDate3,
        endDate3,
        'Online',
        'Zoom Meeting',
        courseId
      ]);
    }
    
    console.log('Added sample classes successfully!');
    await connection.end();
    
  } catch (error) {
    console.error('Error adding classes:', error);
    process.exit(1);
  }
}

main(); 