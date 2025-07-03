import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

/**
 * API endpoint untuk memperbarui nilai participant
 */
export async function PUT(request: NextRequest) {
  console.log("==== PARTICIPANT VALUE UPDATE API - PUT REQUEST ====");
  
  try {
    // Parse data request
    let data;
    try {
      data = await request.json();
      console.log("Request data:", JSON.stringify(data));
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return NextResponse.json(
        { error: "Format JSON tidak valid" },
        { status: 400 }
      );
    }
    
    const { id, valueType, remark, value } = data;

    // Validasi field yang diperlukan
    if (!id) {
      return NextResponse.json({ error: "ID nilai diperlukan" }, { status: 400 });
    }
    
    if (!valueType) {
      return NextResponse.json({ error: "Tipe nilai diperlukan" }, { status: 400 });
    }
    
    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Nilai diperlukan" }, { status: 400 });
    }
    
    try {
      // Periksa apakah nilai sudah ada
      const existingValue = await prisma.valueReport.findUnique({
        where: { id }
      });
      
      if (!existingValue) {
        return NextResponse.json(
          { error: "Data nilai tidak ditemukan" },
          { status: 404 }
        );
      }
      
      // Update nilai
      const updatedValue = await prisma.valueReport.update({
        where: { id },
        data: {
          value_type: valueType,
          remark: remark || '',
          value: Number(value)
        }
      });
      
      console.log("Nilai berhasil diperbarui:", updatedValue.id);
      
      return NextResponse.json({
        id: updatedValue.id,
        valueType: updatedValue.value_type,
        value: updatedValue.value.toString(),
        remark: updatedValue.remark,
        message: "Nilai berhasil diperbarui"
      }, { status: 200 });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { 
          error: "Error database", 
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error pada endpoint update nilai:", error);
    return NextResponse.json(
      { 
        error: "Gagal memperbarui nilai",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 