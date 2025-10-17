import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Hole die Python-API-URL dynamisch (z.B. aus Umgebungsvariable)
  const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL;
  if (!PYTHON_API_URL) {
    return NextResponse.json(
      { error: "PYTHON_API_URL not set" },
      { status: 500 },
    );
  }

  // Reiche das File an die Python-API weiter
  const pythonRes = await fetch(PYTHON_API_URL + "/upload", {
    method: "POST",
    body: formData,
  });

  if (!pythonRes.ok) {
    return NextResponse.json({ error: "Python API error" }, { status: 500 });
  }

  const data = await pythonRes.json();
  return NextResponse.json(data);
}
