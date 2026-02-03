import csvRaw from "./collaborations.csv?raw";
import { withBase } from "../utils/paths";

export interface CollaborationItem {
  id: number;
  title: string;
  image: string;
  url?: string;
}

const IMAGE_BASE_PATH = "images/collaborations/";

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  return cells;
};

const toCollaborationItem = (
  [idRaw, title, imageRaw, url]: string[],
  index: number
): CollaborationItem => {
  // CSVではファイル名のみ指定された場合に画像ディレクトリを自動補完する
  const buildImagePath = (raw?: string | null) => {
    if (!raw) return "";
    if (/^https?:\/\//.test(raw)) return raw;

    const normalized = raw.includes("/")
      ? raw.replace(/^\//, "")
      : `${IMAGE_BASE_PATH}${raw}`;

    return withBase(normalized);
  };

  const image = buildImagePath(imageRaw);

  return {
    id: Number(idRaw) || index + 1,
    title: title ?? "",
    image: image ?? "",
    ...(url ? { url } : {})
  };
};

const parseCollaborationsCsv = (csv: string): CollaborationItem[] =>
  csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => splitCsvLine(line))
    .map((cells, index) => toCollaborationItem(cells, index));

export const collaborations: CollaborationItem[] = parseCollaborationsCsv(csvRaw);
