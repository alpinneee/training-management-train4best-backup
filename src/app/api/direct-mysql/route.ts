import { NextResponse } from "next/server";
import mysql from 'mysql2/promise';
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Create a connection directly
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'train4best'
    });

    // Test the connection
    const [rows] = await connection.execute('SHOW TABLES');
    
    // Close the connection
    await connection.end();
    
    return NextResponse.json({
      success: true,
      message: "Direct MySQL connection successful",
      tables: rows
    });
  } catch (error) {
    console.error("MySQL connection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 