import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import prisma from "@/lib/prisma";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientCategory } = body;

    if (!patientCategory) {
      return NextResponse.json({ success: false, error: "patientCategory is required" }, { status: 400 });
    }

    // The path to the Python scripts
    const path = require('path');
    const pythonDir = path.join(process.cwd(), "ai");

    // Command to run the wrapper script we created
    // We run it inside pythonDir so that relative paths in python (like loading models) work correctly
    const command = `python3 gan_json_wrapper.py --category ${patientCategory}`;

    // Execute the python script
    const { stdout, stderr } = await execAsync(command, { cwd: pythonDir });

    if (stderr && stderr.toLowerCase().includes("error")) {
      console.warn("Python stderr:", stderr);
    }

    let generatedData;
    try {
      generatedData = JSON.parse(stdout.trim());
    } catch (parseError) {
      console.error("Failed to parse Python output:", stdout);
      return NextResponse.json({ success: false, error: "Failed to parse GAN output." }, { status: 500 });
    }

    if (generatedData.error) {
      return NextResponse.json({ success: false, error: generatedData.error }, { status: 500 });
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: "No user found in database." }, { status: 500 });
    }

    const patientReport = await prisma.patientReport.create({
      data: {
        userId: user.id,
        patientCategory,
        data: generatedData,
      }
    });

    return NextResponse.json({ success: true, data: patientReport }, { status: 201 });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
