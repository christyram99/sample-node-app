
String.prototype.capitalize = function () {
  return this.toLowerCase().charAt(0).toUpperCase() + this.toLowerCase().slice(1)
}

function isBoolean (value) {
  return typeof value === 'boolean'
}

function includes (source = [], element) {
  return source.length && element && source.indexOf(element) > -1
}

function has (source = {}, key) {
  return source.hasOwnProperty(key)
}

function get (source, key) {
  return source[key]
}

module.exports =  {
  isBoolean,
  includes,
  has,
  get,
}
