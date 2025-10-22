import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'

// 扩展 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 时间格式化工具类
 * 提供统一的时间格式化方法，确保整个应用的时间格式一致性
 */
export class TimeUtil {
  /**
   * 默认的日期时间格式
   */
  static readonly DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

  /**
   * 默认的日期格式
   */
  static readonly DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'

  /**
   * 默认的时间格式
   */
  static readonly DEFAULT_TIME_FORMAT = 'HH:mm:ss'

  /**
   * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
   * @param date 日期对象、时间戳或日期字符串
   * @param format 自定义格式，默认为 YYYY-MM-DD HH:mm:ss
   * @returns 格式化后的时间字符串
   */
  static formatDateTime(date: Date | string | number, format: string = TimeUtil.DEFAULT_DATETIME_FORMAT): string {
    if (!date) {
      return ''
    }

    try {
      return dayjs(date).format(format)
    } catch (error) {
      console.error('[TimeUtil] formatDateTime error:', error)
      return ''
    }
  }

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   * @param date 日期对象、时间戳或日期字符串
   * @param format 自定义格式，默认为 YYYY-MM-DD
   * @returns 格式化后的日期字符串
   */
  static formatDate(date: Date | string | number, format: string = TimeUtil.DEFAULT_DATE_FORMAT): string {
    if (!date) {
      return ''
    }

    try {
      return dayjs(date).format(format)
    } catch (error) {
      console.error('[TimeUtil] formatDate error:', error)
      return ''
    }
  }

  /**
   * 格式化时间为 HH:mm:ss 格式
   * @param date 日期对象、时间戳或日期字符串
   * @param format 自定义格式，默认为 HH:mm:ss
   * @returns 格式化后的时间字符串
   */
  static formatTime(date: Date | string | number, format: string = TimeUtil.DEFAULT_TIME_FORMAT): string {
    if (!date) {
      return ''
    }

    try {
      return dayjs(date).format(format)
    } catch (error) {
      console.error('[TimeUtil] formatTime error:', error)
      return ''
    }
  }

  /**
   * 获取当前时间的格式化字符串
   * @param format 格式，默认为 YYYY-MM-DD HH:mm:ss
   * @returns 当前时间的格式化字符串
   */
  static now(format: string = TimeUtil.DEFAULT_DATETIME_FORMAT): string {
    return dayjs().format(format)
  }

  /**
   * 获取今天的日期字符串
   * @param format 格式，默认为 YYYY-MM-DD
   * @returns 今天的日期字符串
   */
  static today(format: string = TimeUtil.DEFAULT_DATE_FORMAT): string {
    return dayjs().format(format)
  }

  /**
   * 判断是否为有效的日期
   * @param date 要检查的日期
   * @returns 是否为有效日期
   */
  static isValid(date: any): boolean {
    return dayjs(date).isValid()
  }

  /**
   * 转换为 UTC 时间
   * @param date 日期对象、时间戳或日期字符串
   * @param format 格式，默认为 YYYY-MM-DD HH:mm:ss
   * @returns UTC 时间字符串
   */
  static toUTC(date: Date | string | number, format: string = TimeUtil.DEFAULT_DATETIME_FORMAT): string {
    if (!date) {
      return ''
    }

    try {
      return dayjs(date).utc().format(format)
    } catch (error) {
      console.error('[TimeUtil] toUTC error:', error)
      return ''
    }
  }

  /**
   * 从 UTC 时间转换为本地时间
   * @param utcDate UTC 时间字符串
   * @param format 格式，默认为 YYYY-MM-DD HH:mm:ss
   * @returns 本地时间字符串
   */
  static fromUTC(utcDate: string, format: string = TimeUtil.DEFAULT_DATETIME_FORMAT): string {
    if (!utcDate) {
      return ''
    }

    try {
      return dayjs.utc(utcDate).local().format(format)
    } catch (error) {
      console.error('[TimeUtil] fromUTC error:', error)
      return ''
    }
  }

  /**
   * 计算两个日期之间的差值
   * @param date1 第一个日期
   * @param date2 第二个日期
   * @param unit 单位 ('day', 'hour', 'minute', 'second')
   * @returns 差值
   */
  static diff(date1: Date | string | number, date2: Date | string | number, unit: 'day' | 'hour' | 'minute' | 'second' = 'day'): number {
    try {
      return dayjs(date1).diff(dayjs(date2), unit)
    } catch (error) {
      console.error('[TimeUtil] diff error:', error)
      return 0
    }
  }

  /**
   * 添加时间
   * @param date 基础日期
   * @param amount 添加的数量
   * @param unit 单位
   * @param format 返回格式
   * @returns 格式化后的时间字符串
   */
  static add(date: Date | string | number, amount: number, unit: 'day' | 'hour' | 'minute' | 'second' | 'month' | 'year', format: string = TimeUtil.DEFAULT_DATETIME_FORMAT): string {
    try {
      return dayjs(date).add(amount, unit).format(format)
    } catch (error) {
      console.error('[TimeUtil] add error:', error)
      return ''
    }
  }

  /**
   * 减少时间
   * @param date 基础日期
   * @param amount 减少的数量
   * @param unit 单位
   * @param format 返回格式
   * @returns 格式化后的时间字符串
   */
  static subtract(date: Date | string | number, amount: number, unit: 'day' | 'hour' | 'minute' | 'second' | 'month' | 'year', format: string = TimeUtil.DEFAULT_DATETIME_FORMAT): string {
    try {
      return dayjs(date).subtract(amount, unit).format(format)
    } catch (error) {
      console.error('[TimeUtil] subtract error:', error)
      return ''
    }
  }
}
