// eslint-disable-next-line import/no-extraneous-dependencies
import Taro from '@tarojs/taro'
import isArray from 'lodash/isArray'
import concat from 'lodash/concat'
import last from 'lodash/last'
import findIndex from 'lodash/findIndex'
import { createAction, LoadingType, noop } from './nice-router-util'
import ViewMappingService from './viewmapping.service'
import BackendService from './backend.service'
import LocalCache from './local-cache.service'
import PopupMessage from './popup-message'
import NavigationService from './navigation.service'
import GlobalToast from './global-toast'

function getViewMapping({ xclass, stateAction, effectAction, xredirect, statInPage }) {
  const pages = Taro.getCurrentPages()
  const currentPage = '/' + last(pages).route

  let nextView = ViewMappingService.getView(xclass)

  if (isArray(nextView)) {
    const currentIndex = findIndex(nextView, { pageName: currentPage })
    let nextPageIndex = currentIndex
    if (!statInPage) {
      nextPageIndex = currentIndex + 1 >= nextView.length ? 0 : currentIndex + 1
    }
    nextView = nextView[nextPageIndex]
  }

  const nextPage = nextView.pageName
  const newStateAction = stateAction || nextView.stateAction
  const newEffectAction = effectAction || nextView.effectAction

  console.log('current page is', currentPage, 'next page is', nextView)
  let doRedirect = false
  // if ((xredirect || (!xredirect && !statInPage))
  // && currentPage !== `pages${viewMapping}`) {
  // 1.如果没有设置class 和page 的映射，则不跳转
  // 2.否则，2.1 如果后台告诉我强制跳转，就跳转
  // 2.2 如果后台没告诉强制跳转，也没有设置statInPage，就跳转。既前台说是ajax，既后台默认容许了
  // const sameAsCurrentPage = LATEST_PAGE === url
  // console.log("latest page is", LATEST_PAGE, "current url is", url, "sameAsCurrentPage", sameAsCurrentPage)

  if (nextPage && (xredirect || (!xredirect && !statInPage))) {
    if (nextPage !== currentPage) {
      doRedirect = true
    }
  }

  return {
    pageName: nextPage,
    stateAction: newStateAction,
    effectAction: newEffectAction,
    doRedirect,
  }
}

export default {
  namespace: 'niceRouter',
  state: {
    latestRoute: {},
    isShow: true,
  },
  reducers: {
    saveLatestRoute(state, { payload }) {
      console.log('save latest route', payload)
      return { ...state, latestRoute: payload }
    },
  },

  effects: {
    *retry(action, { put, select }) {
      const { latestRoute } = yield select((state) => state.niceRouter)

      console.log('retry to next', latestRoute)
      if (latestRoute) {
        yield put(createAction('route')(latestRoute))
      }
    },
    *route({ payload }, { call, put }) {
      console.log('niceRouter/router payload', payload)

      const {
        statInPage = false,
        method = 'get',
        uri,
        params = {},
        cache,
        asForm,
        arrayMerge = 'replace',
        onSuccess = noop,
        loading,
        navigationOptions,
      } = payload

      if (!uri) {
        console.warn('store.modules.router.route","can not send empty url to backend')
        return
      }

      const withLoading = loading || (asForm ? LoadingType.modal : LoadingType.none)

      if (asForm) {
        const cached = yield LocalCache.isCachedForm(uri, params)
        if (cached) {
          GlobalToast.show({
            text: '操作太快了，换句话试试',
            duration: 3000,
          })
          return
        }
      }

      yield put(createAction('saveLatestRoute')(payload))

      const remoteRequestParams = {
        method,
        uri,
        params,
        asForm,
        headers: {},
        loading: withLoading,
      }
      const resp = yield call(BackendService.send, remoteRequestParams)

      const { success, xclass, xredirect, data } = resp

      if (data.toast) {
        GlobalToast.show({
          ...data.toast,
          icon: 'none',
        })
      }

      if (data.popup) {
        PopupMessage.show(data.popup)
      }

      onSuccess(data, { ...resp })

      console.log('response status, success?', success)

      if (xclass) {
        const viewMappingParams = {
          xclass,
          xredirect,
          statInPage,
          effectAction: payload.effectAction,
          stateAction: payload.stateAction,
        }
        const viewMapping = getViewMapping(viewMappingParams)

        console.log(`%c nice-router viewMapping`, 'color:red', viewMapping, viewMappingParams)

        const { stateAction, effectAction, pageName, doRedirect } = viewMapping

        const storeData = {
          ...data,
          statInPage,
          arrayMerge,
        }
        const modelActions = concat(stateAction, effectAction)
        for (let i = 0; i < modelActions.length; i++) {
          const modelAction = modelActions[i]
          if (modelAction) {
            yield put(createAction(modelAction)(storeData))
          }
        }

        if (doRedirect) {
          NavigationService.navigate(pageName, {}, { navigationOptions })
        }

        if (cache || !asForm) {
          LocalCache.saveBackendRouter(uri, pageName)
        }
        if (success && asForm) {
          LocalCache.cacheForm(uri, params)
        }
      }
    },
  },
  subscriptions: {},
}
