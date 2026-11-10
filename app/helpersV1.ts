import { Version } from './type'
import RebalanceHelper from './helpersBase'

/**
 * v1: chỉ dùng logic gốc trong RebalanceHelper, không có hệ thống point.
 */
class RebalanceV1 extends RebalanceHelper {
  readonly version: Version = 'v1'
}

export default RebalanceV1
