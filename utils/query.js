export function parseJSON(value, fallback) {
  if (value === undefined) return fallback;
  try { return JSON.parse(value); } catch { return undefined; }
}

// Apply: where, sort, select, skip, limit, count
export function applyQueryParams(model, reqQuery, baseFilter = {}) {
  const q = model.find(baseFilter);

  if (reqQuery.where !== undefined) {
    const where = parseJSON(reqQuery.where);
    if (where === undefined) throw new Error("Invalid JSON for 'where'.");
    q.find(where);
  }
  if (reqQuery.sort !== undefined) {
    const sort = parseJSON(reqQuery.sort);
    if (sort === undefined) throw new Error("Invalid JSON for 'sort'.");
    q.sort(sort);
  }
  if (reqQuery.select !== undefined) {
    const select = parseJSON(reqQuery.select);
    if (select === undefined) throw new Error("Invalid JSON for 'select'.");
    q.select(select);
  }
  if (reqQuery.skip !== undefined) {
    const skip = Number(reqQuery.skip);
    if (Number.isNaN(skip) || skip < 0) throw new Error("Invalid 'skip'.");
    q.skip(skip);
  }
  if (reqQuery.limit !== undefined) {
    const limit = Number(reqQuery.limit);
    if (Number.isNaN(limit) || limit < 0) throw new Error("Invalid 'limit'.");
    q.limit(limit);
  }

  const count = String(reqQuery.count).toLowerCase() === 'true';
  return { query: q, count };
}
