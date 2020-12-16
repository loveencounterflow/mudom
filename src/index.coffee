'use strict'

do =>
  µ = require './main.js'
  if globalThis.window?
    globalThis.µ = µ
  else
    module.exports = µ
  return null

