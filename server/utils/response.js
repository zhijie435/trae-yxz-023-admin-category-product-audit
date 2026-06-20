function ok(res, data, message = 'ok') {
  res.json({ code: 0, message, data })
}

function fail(res, message, code = 400) {
  res.status(code).json({ code, message, data: null })
}

function notFound(res, message = '资源不存在') {
  fail(res, message, 404)
}

function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = { ok, fail, notFound, wrapAsync }
