export function rupiah(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function shortRupiah(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return rupiah(n);
}

export function tanggal(value: string | Date | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function tanggalJam(value: string | Date | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function terbilang(n: number | null | undefined): string {
  const nominal = Math.floor(Math.abs(Number(n ?? 0)));
  if (nominal === 0) return "Nol Rupiah";

  const angka = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function bilang(num: number): string {
    if (num < 12) return angka[num] ?? "";
    if (num < 20) return bilang(num - 10) + " Belas";
    if (num < 100)
      return (
        bilang(Math.floor(num / 10)) +
        " Puluh" +
        (num % 10 !== 0 ? " " + bilang(num % 10) : "")
      );
    if (num < 200) return "Seratus" + (num - 100 !== 0 ? " " + bilang(num - 100) : "");
    if (num < 1000)
      return (
        bilang(Math.floor(num / 100)) +
        " Ratus" +
        (num % 100 !== 0 ? " " + bilang(num % 100) : "")
      );
    if (num < 2000) return "Seribu" + (num - 1000 !== 0 ? " " + bilang(num - 1000) : "");
    if (num < 1000000)
      return (
        bilang(Math.floor(num / 1000)) +
        " Ribu" +
        (num % 1000 !== 0 ? " " + bilang(num % 1000) : "")
      );
    if (num < 1000000000)
      return (
        bilang(Math.floor(num / 1000000)) +
        " Juta" +
        (num % 1000000 !== 0 ? " " + bilang(num % 1000000) : "")
      );
    if (num < 1000000000000)
      return (
        bilang(Math.floor(num / 1000000000)) +
        " Miliar" +
        (num % 1000000000 !== 0 ? " " + bilang(num % 1000000000) : "")
      );
    return (
      bilang(Math.floor(num / 1000000000000)) +
      " Triliun" +
      (num % 1000000000000 !== 0 ? " " + bilang(num % 1000000000000) : "")
    );
  }

  return bilang(nominal).trim() + " Rupiah";
}

