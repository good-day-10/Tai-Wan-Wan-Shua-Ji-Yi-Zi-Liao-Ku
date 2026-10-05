export type ArchiveConflictPathSegment = string | { id: string } | { order: true };
export type ArchiveConflictChoice = 'server' | 'draft';

export type ArchiveConflict = {
  id: string;
  path: ArchiveConflictPathSegment[];
  label: string;
  serverValue: unknown;
  draftValue: unknown;
};

type ArchiveLike = Record<string, unknown> & { version?: number };

const memoryFieldLabels: Record<string, string> = {
  title: '標題',
  location: '地點',
  era: '年代',
  category: '分類',
  storyteller: '說故事的人',
  excerpt: '一句話摘錄',
  story: '完整故事',
  storyHtml: '故事格式',
  color: '卡片色彩',
  mark: '卡片標記',
  image: '封面圖片',
  images: '故事圖片',
};

const blockFieldLabels: Record<string, string> = {
  label: '名稱',
  section: '所在區段',
  html: '文字內容',
  x: '水平位置',
  y: '垂直位置',
  width: '寬度',
  align: '文字對齊',
};

const pageFieldLabels: Record<string, string> = {
  title: '頁面名稱',
  slug: '頁面網址',
  backgroundImage: '頁面背景圖片',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function equalValues(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => equalValues(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && equalValues(left[key], right[key]));
}

function getUniqueIdentifiedArray(value: unknown): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value)) return null;
  const entries: Array<Record<string, unknown>> = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string' || ids.has(item.id)) return null;
    ids.add(item.id);
    entries.push(item);
  }
  return entries;
}

function getRecordTitle(archive: ArchiveLike, collectionPath: string[], id: string): string {
  let current: unknown = archive;
  for (const key of collectionPath) {
    if (!isRecord(current)) return id;
    current = current[key];
  }
  if (!Array.isArray(current)) return '';
  const item = current.find((entry) => isRecord(entry) && entry.id === id);
  if (!isRecord(item)) return '';
  const title = item.title ?? item.label;
  return typeof title === 'string' && title.trim() ? title : '';
}

function getConflictLabel(path: ArchiveConflictPathSegment[], server: ArchiveLike, draft: ArchiveLike): string {
  const keys = path.filter((segment): segment is string => typeof segment === 'string');
  const orderIndex = path.findIndex((segment) => typeof segment === 'object' && 'order' in segment);
  if (orderIndex >= 0) {
    const collection = path.slice(0, orderIndex).filter((segment): segment is string => typeof segment === 'string');
    if (collection.at(-1) === 'memories') return '記憶清單順序';
    if (collection.at(-1) === 'pages') return '自訂主題頁面順序';
    if (collection.at(-1) === 'blocks') return '文字區塊順序';
  }

  if (keys[0] === 'introduction') return '資料庫介紹';
  if (keys[0] === 'memories') {
    const id = path.find((segment): segment is { id: string } => typeof segment === 'object' && 'id' in segment)?.id;
    const field = [...keys].reverse().find((key) => key !== 'memories');
    if (!id) return '記憶清單';
    const title = getRecordTitle(server, ['memories'], id) || getRecordTitle(draft, ['memories'], id) || id;
    return field ? `記憶「${title}」的${memoryFieldLabels[field] ?? field}` : `記憶「${title}」`;
  }

  if (keys[0] === 'siteContent') {
    const pageIndex = keys.indexOf('pages');
    if (pageIndex >= 0) {
      const id = path.find((segment): segment is { id: string } => typeof segment === 'object' && 'id' in segment)?.id;
      if (!id) return '自訂主題頁面';
      const title = getRecordTitle(server, ['siteContent', 'pages'], id) || getRecordTitle(draft, ['siteContent', 'pages'], id) || id;
      const field = [...keys].reverse().find((key) => !['siteContent', 'pages', 'blocks'].includes(key));
      if (keys.includes('blocks')) {
        return field
          ? `自訂主題「${title}」的文字區塊${blockFieldLabels[field] ?? field}`
          : `自訂主題「${title}」的文字區塊`;
      }
      if (!field) return `自訂主題「${title}」的文字內容`;
      return `自訂主題「${title}」的${pageFieldLabels[field] ?? field}`;
    }

    if (keys.includes('blocks')) {
      const id = path.find((segment): segment is { id: string } => typeof segment === 'object' && 'id' in segment)?.id;
      if (!id) return '首頁文字區塊';
      const title = getRecordTitle(server, ['siteContent', 'blocks'], id) || getRecordTitle(draft, ['siteContent', 'blocks'], id) || id;
      const field = [...keys].reverse().find((key) => !['siteContent', 'blocks'].includes(key));
      return field ? `首頁「${title}」的${blockFieldLabels[field] ?? field}` : `首頁文字區塊「${title}」`;
    }
  }

  return keys.join('・') || '資料內容';
}

export function findArchiveConflicts(server: ArchiveLike, draft: ArchiveLike): ArchiveConflict[] {
  const conflicts: ArchiveConflict[] = [];

  const addConflict = (path: ArchiveConflictPathSegment[], serverValue: unknown, draftValue: unknown) => {
    conflicts.push({
      id: JSON.stringify(path),
      path,
      label: getConflictLabel(path, server, draft),
      serverValue,
      draftValue,
    });
  };

  const compare = (serverValue: unknown, draftValue: unknown, path: ArchiveConflictPathSegment[]) => {
    if (equalValues(serverValue, draftValue)) return;

    const serverArray = getUniqueIdentifiedArray(serverValue);
    const draftArray = getUniqueIdentifiedArray(draftValue);
    if (serverArray && draftArray) {
      const sharedIds = new Set(serverArray.map((item) => item.id).filter((id): id is string =>
        typeof id === 'string' && draftArray.some((draftItem) => draftItem.id === id)));
      const serverOrder = serverArray.map((item) => item.id).filter((id): id is string => typeof id === 'string' && sharedIds.has(id));
      const draftOrder = draftArray.map((item) => item.id).filter((id): id is string => typeof id === 'string' && sharedIds.has(id));
      if (!equalValues(serverOrder, draftOrder)) {
        addConflict([...path, { order: true }], serverArray.map((item) => item.id), draftArray.map((item) => item.id));
      }

      const serverById = new Map(serverArray.map((item) => [item.id as string, item]));
      const draftById = new Map(draftArray.map((item) => [item.id as string, item]));
      const ids = [...serverById.keys(), ...[...draftById.keys()].filter((id) => !serverById.has(id))];
      for (const id of ids) {
        const serverItem = serverById.get(id);
        const draftItem = draftById.get(id);
        if (serverItem === undefined || draftItem === undefined) {
          addConflict([...path, { id }], serverItem, draftItem);
        } else {
          compare(serverItem, draftItem, [...path, { id }]);
        }
      }
      return;
    }

    if (isRecord(serverValue) && isRecord(draftValue)) {
      const keys = [...new Set([...Object.keys(serverValue), ...Object.keys(draftValue)])];
      for (const key of keys) {
        if (path.length === 0 && key === 'version') continue;
        if (!(key in serverValue) || !(key in draftValue)) {
          addConflict([...path, key], serverValue[key], draftValue[key]);
        } else {
          compare(serverValue[key], draftValue[key], [...path, key]);
        }
      }
      return;
    }

    addConflict(path, serverValue, draftValue);
  };

  compare(server, draft, []);
  return conflicts;
}

function applyDraftValue(target: unknown, path: ArchiveConflictPathSegment[], draftValue: unknown, index = 0): unknown {
  if (index === path.length) return structuredClone(draftValue);
  const segment = path[index];

  if (typeof segment === 'string') {
    const result = isRecord(target) ? { ...target } : {};
    const next = applyDraftValue(result[segment], path, draftValue, index + 1);
    if (next === undefined) delete result[segment];
    else result[segment] = next;
    return result;
  }

  if ('order' in segment) {
    if (!Array.isArray(target) || !Array.isArray(draftValue)) return target;
    const byId = new Map(target
      .filter((item): item is Record<string, unknown> => isRecord(item) && typeof item.id === 'string')
      .map((item) => [item.id as string, item]));
    const ordered: unknown[] = [];
    for (const id of draftValue) {
      if (typeof id !== 'string') continue;
      const item = byId.get(id);
      if (item) {
        ordered.push(item);
        byId.delete(id);
      }
    }
    return [...ordered, ...byId.values()];
  }

  if (!Array.isArray(target)) return target;
  const result = [...target];
  const foundIndex = result.findIndex((item) => isRecord(item) && item.id === segment.id);
  if (index + 1 === path.length) {
    if (draftValue === undefined) {
      if (foundIndex >= 0) result.splice(foundIndex, 1);
    } else if (foundIndex >= 0) {
      result[foundIndex] = structuredClone(draftValue);
    } else {
      result.push(structuredClone(draftValue));
    }
    return result;
  }

  if (foundIndex < 0) return result;
  const next = applyDraftValue(result[foundIndex], path, draftValue, index + 1);
  if (next === undefined) result.splice(foundIndex, 1);
  else result[foundIndex] = next;
  return result;
}

export function mergeArchiveConflictChoices<T extends ArchiveLike>(
  serverArchive: T,
  conflicts: ArchiveConflict[],
  choices: Record<string, ArchiveConflictChoice>,
): T {
  let merged: unknown = structuredClone(serverArchive);
  for (const conflict of conflicts) {
    if (choices[conflict.id] !== 'draft') continue;
    merged = applyDraftValue(merged, conflict.path, conflict.draftValue);
  }
  return merged as T;
}

export function formatArchiveConflictValue(value: unknown): string {
  if (value === undefined) return '（此版本沒有這項內容）';
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) return `［圖片內容，約 ${value.length.toLocaleString()} 個字元］`;
    return value;
  }
  const formatted = JSON.stringify(value, (_key, nestedValue: unknown) =>
    typeof nestedValue === 'string' && nestedValue.startsWith('data:image/')
      ? `［圖片內容，約 ${nestedValue.length.toLocaleString()} 個字元］`
      : nestedValue, 2);
  return formatted ?? String(value);
}
