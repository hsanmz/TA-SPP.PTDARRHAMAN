type XlsxModule = typeof import("xlsx");

const loadXlsx = (): Promise<XlsxModule> => import("xlsx");

export type StudentRow = {
  nis: string;
  full_name: string;
  gender: string | null;
  class_name: string | null;
  grade_level: number | null;
  cohort: string | null;
  status: "active" | "graduated" | "inactive";
  guardian_phone: string | null;
};

const HEADERS = [
  "NIS",
  "Nama Lengkap",
  "Jenis Kelamin (L/P)",
  "Kelas",
  "Tingkat (angka)",
  "Angkatan",
  "Status (active/graduated/inactive)",
  "No. HP Wali",
];

export async function downloadWorkbook(
  rows: (string | number | null)[][],
  sheetName: string,
  fileName: string,
) {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = (rows[0] ?? []).map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export function downloadStudentTemplate() {
  void downloadWorkbook(
    [HEADERS, ["24001", "Ahmad Fauzi", "L", "7A", 7, "2024", "active", "081234567890"]],
    "Template Siswa",
    "template-import-siswa.xlsx",
  );
}

export async function exportStudents(students: StudentRow[]) {
  await downloadWorkbook(
    [
      HEADERS,
      ...students.map((s) => [
        s.nis,
        s.full_name,
        s.gender ?? "",
        s.class_name ?? "",
        s.grade_level ?? "",
        s.cohort ?? "",
        s.status,
        s.guardian_phone ?? "",
      ]),
    ],
    "Siswa",
    "data-siswa.xlsx",
  );
}

export async function parseStudentFile(file: File): Promise<StudentRow[]> {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return [];
  const sheet = wb.Sheets[firstSheet];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const pick = (row: Record<string, unknown>, keys: string[]) => {
    for (const key of Object.keys(row)) {
      const norm = key.toLowerCase().trim();
      if (keys.some((k) => norm.startsWith(k))) {
        const value = row[key];
        return value === "" || value === null || value === undefined ? null : String(value).trim();
      }
    }
    return null;
  };

  const allowed = new Set(["active", "graduated", "inactive"]);

  return raw
    .map((row) => {
      const status = (pick(row, ["status"]) ?? "active").toLowerCase();
      const grade = pick(row, ["tingkat", "grade"]);
      return {
        nis: pick(row, ["nis"]) ?? "",
        full_name: pick(row, ["nama"]) ?? "",
        gender: pick(row, ["jenis kelamin", "gender", "jk"]),
        class_name: pick(row, ["kelas", "class"]),
        grade_level: grade ? Number(grade) || null : null,
        cohort: pick(row, ["angkatan", "cohort"]),
        status: (allowed.has(status) ? status : "active") as StudentRow["status"],
        guardian_phone: pick(row, ["no. hp", "no hp", "telepon", "phone", "hp"]),
      };
    })
    .filter((r) => r.nis && r.full_name);
}
