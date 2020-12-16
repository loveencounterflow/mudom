'use strict'

do =>
  { µ, } = require './main.js'
  console.log '^0082^', µ
  if globalThis.window?
    globalThis.µ = µ
  else
    module.exports = µ
  return null

