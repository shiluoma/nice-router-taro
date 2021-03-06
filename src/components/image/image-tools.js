import m_ from '@/utils/mini-lodash'
import curryRight from 'lodash/curryRight'

// const logo = require('./images/default_id_icon.png')

function loadServerImage(uri, style) {
  if (!uri) {
    console.warn('image uri could not be', uri)
    return uri
  }
  let url = uri || ''
  if (!/^(http|https):/.test(url) || url.indexOf('x-oss-process') > -1) {
    return url
  }
  return url + style
}

// taro 1.3以后才支持克里化
const curriedLoadImgWithStyle = curryRight(loadServerImage)
const loadTinyImg = curriedLoadImgWithStyle('?x-oss-process=style/tiny')
const loadSmallImg = curriedLoadImgWithStyle('?x-oss-process=style/small')
const loadMiddleImg = curriedLoadImgWithStyle('?x-oss-process=style/middle')
const loadNormalImg = curriedLoadImgWithStyle('?x-oss-process=style/normal')
const loadLargeImg = curriedLoadImgWithStyle('?x-oss-process=style/large')
const loadXLargeImg = curriedLoadImgWithStyle('?x-oss-process=style/xlarge')
const loadOriginImg = curriedLoadImgWithStyle('?x-oss-process=style/origin')
const loadThumbnailImg = curriedLoadImgWithStyle('?x-oss-process=style/thumbnail')

const getServerImagUrl = (uri, size = 'normal') => {
  let url = m_.trim(uri || '')
  let result = url
  if (url) {
    switch (size) {
      case 'thumbnail':
        result = loadThumbnailImg(url)
        break
      case 'tiny':
        result = loadTinyImg(url)
        break
      case 'small':
        result = loadSmallImg(url)
        break
      case 'middle':
        result = loadMiddleImg(url)
        break
      case 'normal':
        result = loadNormalImg(url)
        break
      case 'large':
        result = loadLargeImg(url)
        break
      case 'xlarge':
        result = loadXLargeImg(url)
        break
      case 'origin':
        result = loadOriginImg(url)
        break
      default:
        result = loadServerImage(url)
    }
  }
  return result
}

const ImageTools = {
  loadTinyImg,
  loadSmallImg,
  loadMiddleImg,
  loadNormalImg,
  loadLargeImg,
  loadXLargeImg,
  loadOriginImg,
  loadThumbnailImg,
  getServerImagUrl,
}
export default ImageTools
