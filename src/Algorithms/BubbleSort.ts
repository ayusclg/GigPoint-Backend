export function bubbleSortArray<T>(arr: T[], key: string, order: "asc" | "desc" = "asc"): T[] {
  const result = [...arr];
  const n = result.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      const first = (result[j] as any)[key];
      const second = (result[j + 1] as any)[key];

      let val1: any = first;
      let val2: any = second;
      if (!isNaN(Date.parse(first))) val1 = new Date(first).getTime();
      if (!isNaN(Date.parse(second))) val2 = new Date(second).getTime();

      if ((order === "asc" && val1 > val2) || (order === "desc" && val1 < val2)) {
        const temp = result[j];
        result[j] = result[j + 1];
        result[j + 1] = temp;
      }
    }
  }

  return result;
}
