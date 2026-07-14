/// <reference path="./types/index.d.ts" />

/** TextDecoder polyfill for non-DOM TS lib targets */
declare class TextDecoder {
  constructor(encoding?: string)
  decode(buffer?: ArrayBuffer | ArrayBufferView): string
}

/** Skyline 渲染引擎下的 document 对象 */
declare var document: {
  documentElement: {
    style: {
      setProperty(propertyName: string, value: string | null): void
    }
  }
}

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo | null,
    systemInfo?: WechatMiniprogram.SystemInfo | null,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}
