// https://github.com/Meituan-Dianping/mpvue/issues/736
import concat from 'lodash/concat'
import filter from 'lodash/filter'
import isString from 'lodash/isString'
import isObject from 'lodash/isObject'
import values from 'lodash/values'
import merge from 'lodash/merge'
import forEach from 'lodash/forEach'
import niceRouter from '@/nice-router/nice-router.model'

import ModelTools from './model-tools'
import app from './app.model'
import listof from '../listof/listof.model'
import home from './biz/home.model'

const modelListOOTB = [
  niceRouter,
  app,
  home,
  listof,
  'me',
  'navigationList',
  'H5',
  'genericpage',
  'genericpage2',
  'listofpage',
  'listofpage2',
  'listofpage3',
  'listofpage4',
  //biz
  'article',
  'recommendUser',
]

const customizedModelList = []

let modelList = []
modelList = concat(modelList, filter(modelListOOTB, isString))
modelList = concat(modelList, filter(customizedModelList, isString))

modelList = concat(modelList, filter(modelListOOTB, isObject))
modelList = concat(modelList, filter(customizedModelList, isObject))

const modelContainer = {}
console.log('prepare to initial models from modelList', modelList)

forEach(modelList, (it) => {
  const nameSpace = isString(it) ? it : it.namespace

  let modelObj = ModelTools.createDefault(nameSpace)
  if (!isString(it)) {
    modelObj = merge(modelObj, it)
  }
  modelContainer[nameSpace] = modelObj
})
const models = values(modelContainer)
console.log('models of list:', models)

export default models
