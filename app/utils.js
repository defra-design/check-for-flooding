module.exports = {
  getSlug: (string) => {
    return string.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase()
  }
}
