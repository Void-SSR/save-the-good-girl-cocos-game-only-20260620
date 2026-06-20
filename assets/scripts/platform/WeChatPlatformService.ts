export interface WeChatLike {
  getSystemInfoSync?: () => { windowWidth?: number; windowHeight?: number; pixelRatio?: number; safeArea?: unknown };
  setStorageSync?: (key: string, value: string) => void;
  getStorageSync?: (key: string) => string;
  removeStorageSync?: (key: string) => void;
}

export class WeChatPlatformService {
  constructor(private readonly wxApi: WeChatLike | null) {}

  get isWeChatGame(): boolean {
    return Boolean(this.wxApi);
  }

  getDeviceInfo(): { width: number; height: number; pixelRatio: number } {
    const info = this.wxApi?.getSystemInfoSync?.();
    return {
      width: info?.windowWidth ?? 750,
      height: info?.windowHeight ?? 1334,
      pixelRatio: info?.pixelRatio ?? 1
    };
  }
}

