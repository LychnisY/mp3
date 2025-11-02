export function ok(res, data, message = 'OK') {
  return res.status(200).json({ message, data });
}

export function created(res, data, message = 'Created') {
  return res.status(201).json({ message, data });
}

export function noContent(res, message = 'No Content') {
  return res.status(204).json({ message, data: null });
}

export function badRequest(res, message = 'Bad Request', data = null) {
  return res.status(400).json({ message, data });
}

export function notFound(res, message = 'Not Found', data = null) {
  return res.status(404).json({ message, data });
}

export function serverError(res, err, fallback = 'Server Error') {
  const message = err?.message || fallback;
  return res.status(500).json({ message, data: null });
}
