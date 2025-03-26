import { ref } from 'vue'

type TransformType = 'rotate' | 'translate' | 'scale' | 'skew'
type PrefixClass<T extends string> = `transform-${TransformType}-${T}`
/**
 * 使用旋转动画
 * @param duration 5的倍数 150 - 3000
 * const { transitionClass, triggerTransition } = useCSSTransition(1000, 'transform-rotate-360')
 */
export function useCSSTransition<T extends string>(duration: number, customClass: PrefixClass<T>) {
  const transitionClass = ref(`transition-transform-${duration}`)
  function triggerTransition() {
    transitionClass.value = `transition-transform-${duration} ${customClass}`
    setTimeout(() => {
      transitionClass.value = `transition-transform-${duration}`
    }, duration)
  }
  return {
    transitionClass,
    triggerTransition
  }
}
