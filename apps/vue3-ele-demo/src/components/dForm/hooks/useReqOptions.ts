import { mockOptions } from "../../dict/mockOptions"
import { Ref, ref } from 'vue'
export default function(optionsApi: string, extraOptions: Record<string, any[]>) {
    const options: Ref<Record<string, any[]>> = ref({})
    if (optionsApi.length) {
        new Promise<void>((resolve) => {
            setTimeout(() => {
                options.value = { ...mockOptions as unknown as Record<string, unknown[]>, ...extraOptions }
                resolve()
            }, 1000)
        })
    }
    return options
}