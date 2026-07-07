export function success(res, { message = 'Success', data = null, status = 200 } = {}) {
  return res.status(status).json({ success: true, message, data, errors: [] });
}

export function failure(res, { message = 'Something went wrong', errors = [], status = 400 } = {}) {
  return res.status(status).json({ success: false, message, data: null, errors });
}
