export function downloadCSV(
  filename: string,
  header: string[],
  rows: (string | number | undefined | null)[][]
) {
  const esc = (v: string | number | undefined | null) => {
    const s = String(v ?? "")
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const csv = `\uFEFF${[header, ...rows].map((r) => r.map(esc).join(",")).join("\n")}`
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}