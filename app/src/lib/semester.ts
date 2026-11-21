export type Semester = {
  key: string; // "2026-ganjil"
  label: string; // "Ganjil 2026/2027"
  startYear: number;
  type: "ganjil" | "genap";
  months: { year: number; month: number }[];
  from: string; // ISO date
  to: string; // ISO date (exclusive)
};

/** Ganjil = Juli–Desember, Genap = Januari–Juni. */
export function semesterOf(year: number, month: number): Semester {
  const type: "ganjil" | "genap" = month >= 7 ? "ganjil" : "genap";
  const startYear = type === "ganjil" ? year : year - 1;
  return buildSemester(startYear, type);
}

export function buildSemester(startYear: number, type: "ganjil" | "genap"): Semester {
  const months =
    type === "ganjil"
      ? [7, 8, 9, 10, 11, 12].map((m) => ({ year: startYear, month: m }))
      : [1, 2, 3, 4, 5, 6].map((m) => ({ year: startYear + 1, month: m }));
  const first = months[0]!;
  const last = months[months.length - 1]!;
  const pad = (n: number) => String(n).padStart(2, "0");
  const toMonth = last.month === 12 ? 1 : last.month + 1;
  const toYear = last.month === 12 ? last.year + 1 : last.year;
  return {
    key: `${startYear}-${type}`,
    label: `${type === "ganjil" ? "Ganjil" : "Genap"} ${startYear}/${startYear + 1}`,
    startYear,
    type,
    months,
    from: `${first.year}-${pad(first.month)}-01`,
    to: `${toYear}-${pad(toMonth)}-01`,
  };
}

export function currentSemester(now = new Date()): Semester {
  return semesterOf(now.getFullYear(), now.getMonth() + 1);
}

export function academicYearLabel(now = new Date()): string {
  const s = currentSemester(now);
  return `${s.startYear}/${s.startYear + 1}`;
}

/** Daftar semester untuk filter laporan: dari beberapa tahun ke belakang sampai semester ini. */
export function semesterOptions(back = 4): Semester[] {
  const current = currentSemester();
  const list: Semester[] = [];
  let year = current.startYear;
  let type = current.type;
  for (let i = 0; i < back * 2; i++) {
    list.push(buildSemester(year, type));
    if (type === "genap") {
      type = "ganjil";
    } else {
      type = "genap";
      year -= 1;
    }
  }
  return list;
}

export function semesterFromKey(key: string): Semester {
  const [year, type] = key.split("-");
  return buildSemester(Number(year), type === "genap" ? "genap" : "ganjil");
}
