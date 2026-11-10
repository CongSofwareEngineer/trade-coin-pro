import { BigNumber } from 'bignumber.js'

import { Version } from './type'
import RebalanceV4 from './helpersV4'

//v5: khi load file, mỗi ô giá token cộng thêm 0.05
export const PRICE_OFFSET_V5 = 0.05

/**
 * v5 = y nguyên logic v4, chỉ khác: mọi giá đọc từ file được cộng PRICE_OFFSET_V5.
 */
class RebalanceV5 extends RebalanceV4 {
  readonly version: Version = 'v5'

  formatPrice(price: number) {
    return BigNumber(price).plus(PRICE_OFFSET_V5).toNumber()
  }
}

export default RebalanceV5
