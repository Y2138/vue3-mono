import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ResourceForm from '../ResourceForm.vue'
import { useMessage } from 'naive-ui'

// Mock Naive UI components
vi.mock('naive-ui', () => ({
  useMessage: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn()
  })),
  NCard: {
    name: 'NCard',
    template: '<div class="n-card"><slot name="header-extra"></slot><slot></slot></div>'
  },
  NFlex: {
    name: 'NFlex',
    template: '<div class="n-flex"><slot></slot></div>'
  },
  NButton: {
    name: 'NButton',
    template: '<button @click="$emit(\'click\')"><slot></slot></button>'
  },
  NIcon: {
    name: 'NIcon',
    template: '<div class="n-icon"><slot></slot></div>'
  }
}))

// Mock Icon component
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span class="icon"></span>'
  }
}))

// Mock API functions
const mockGetResources = vi.fn()
const mockGetResourceById = vi.fn()
const mockGetResourceEnums = vi.fn()
const mockCreateResource = vi.fn()
const mockUpdateResource = vi.fn()

vi.mock('@/request/api/resource', () => ({
  getResources: () => mockGetResources(),
  getResourceById: () => mockGetResourceById(),
  getResourceEnums: () => mockGetResourceEnums(),
  createResource: () => mockCreateResource(),
  updateResource: () => mockUpdateResource()
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {}
  }),
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock FormRoot component
vi.mock('@/components/dForm/FormRoot.vue', () => ({
  name: 'FormRoot',
  template: '<div class="form-root"><slot></slot></div>'
}))

describe('ResourceForm Component', () => {
  let wrapper: any
  let mockMessage: any

  beforeEach(() => {
    mockMessage = {
      success: vi.fn(),
      error: vi.fn()
    }
    vi.mocked(useMessage).mockReturnValue(mockMessage)

    // Setup default mock responses
    mockGetResourceEnums.mockResolvedValue([
      { data: { resourceType: [
        { label: '菜单', value: 1 },
        { label: 'API', value: 2 },
        { label: '页面', value: 3 },
        { label: '模块', value: 4 }
      ]}}
    ])
    
    mockGetResources.mockResolvedValue([
      { data: { items: [
        { id: '1', name: '系统管理', type: 1, parentId: null },
        { id: '2', name: '用户管理', type: 1, parentId: '1' }
      ]}}
    ])

    mockCreateResource.mockResolvedValue({ data: { id: 'new-id' } })
    mockUpdateResource.mockResolvedValue({ data: { id: '1' } })

    wrapper = mount(ResourceForm, {
      global: {
        stubs: {
          FormRoot: true,
          NCard: true,
          NFlex: true,
          NButton: true,
          NIcon: true,
          Icon: true
        }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.clearAllMocks()
  })

  describe('Resource Type Handling', () => {
    it('should load resource types on mount', async () => {
      await wrapper.vm.$nextTick()
      expect(mockGetResourceEnums).toHaveBeenCalled()
    })

    it('should have all four resource types available', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.selectOptions.resourceTypes).toHaveLength(4)
      expect(wrapper.vm.selectOptions.resourceTypes).toEqual([
        { label: '菜单', value: 1 },
        { label: 'API', value: 2 },
        { label: '页面', value: 3 },
        { label: '模块', value: 4 }
      ])
    })
  })

  describe('Parent Resource Field Visibility', () => {
    it('should show parent field for MENU type (type=1)', async () => {
      wrapper.vm.formData.type = 1
      await wrapper.vm.$nextTick()
      
      const parentConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'parentId')
      expect(parentConfig.required).toBe(false)
    })

    it('should show parent field for API type (type=2)', async () => {
      wrapper.vm.formData.type = 2
      await wrapper.vm.$nextTick()
      
      const parentConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'parentId')
      expect(parentConfig.required).toBe(true)
      expect(parentConfig.showRequireMark).toBe(true)
    })

    it('should show parent field for PAGE type (type=3)', async () => {
      wrapper.vm.formData.type = 3
      await wrapper.vm.$nextTick()
      
      const parentConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'parentId')
      expect(parentConfig.required).toBe(true)
      expect(parentConfig.showRequireMark).toBe(true)
    })

    it('should show parent field for MODULE type (type=4)', async () => {
      wrapper.vm.formData.type = 4
      await wrapper.vm.$nextTick()
      
      const parentConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'parentId')
      expect(parentConfig.required).toBe(true)
      expect(parentConfig.showRequireMark).toBe(true)
    })
  })

  describe('Suffix Field Visibility', () => {
    it('should show suffix field only for MODULE type (type=4) in create mode', async () => {
      wrapper.vm.formData.type = 4
      await wrapper.vm.$nextTick()
      
      const suffixConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'suffix')
      expect(suffixConfig.visibleLinks).toBeDefined()
      
      const isVisible = suffixConfig.visibleLinks(wrapper.vm.formData)
      expect(isVisible).toBe(true)
    })

    it('should not show suffix field for MENU type (type=1)', async () => {
      wrapper.vm.formData.type = 1
      await wrapper.vm.$nextTick()
      
      const suffixConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'suffix')
      expect(suffixConfig.visibleLinks).toBeDefined()
      
      const isVisible = suffixConfig.visibleLinks(wrapper.vm.formData)
      expect(isVisible).toBe(false)
    })

    it('should not show suffix field for API type (type=2)', async () => {
      wrapper.vm.formData.type = 2
      await wrapper.vm.$nextTick()
      
      const suffixConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'suffix')
      expect(suffixConfig.visibleLinks).toBeDefined()
      
      const isVisible = suffixConfig.visibleLinks(wrapper.vm.formData)
      expect(isVisible).toBe(false)
    })

    it('should not show suffix field for PAGE type (type=3)', async () => {
      wrapper.vm.formData.type = 3
      await wrapper.vm.$nextTick()
      
      const suffixConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'suffix')
      expect(suffixConfig.visibleLinks).toBeDefined()
      
      const isVisible = suffixConfig.visibleLinks(wrapper.vm.formData)
      expect(isVisible).toBe(false)
    })
  })

  describe('Suffix Field Validation', () => {
    it('should require suffix for MODULE type', async () => {
      wrapper.vm.formData.type = 4
      wrapper.vm.formData.suffix = ''
      await wrapper.vm.$nextTick()
      
      const suffixConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'suffix')
      expect(suffixConfig.required).toBe(false) // Required is controlled by validator
      
      // Test validator
      const validator = suffixConfig.rules[0].validator
      const result = validator({}, '')
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('资源后缀不能为空')
    })

    it('should validate suffix format (only letters, numbers, underscores)', async () => {
      const suffixConfig = wrapper.vm.formConfigs.find((c: any) => c.valueKey === 'suffix')
      const validator = suffixConfig.rules[1].validator
      
      // Valid format
      expect(validator({}, 'valid_suffix123')).toBe(true)
      
      // Invalid format with special characters
      const result = validator({}, 'invalid-suffix!')
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('资源后缀只能包含字母、数字和下划线')
    })
  })

  describe('Form Submission', () => {
    it('should call createResource when submitting in create mode', async () => {
      wrapper.vm.formData = {
        name: '新资源',
        type: 1,
        path: '/new-resource',
        parentId: null,
        sortOrder: 0,
        description: '测试描述',
        suffix: ''
      }
      
      await wrapper.vm.handleSubmit()
      
      expect(mockCreateResource).toHaveBeenCalled()
      expect(mockMessage.success).toHaveBeenCalled()
    })

    it('should call updateResource when submitting in edit mode', async () => {
      // Set edit mode by setting id
      wrapper.vm.formData.id = '1'
      wrapper.vm.formData = {
        id: '1',
        name: '更新资源',
        type: 1,
        path: '/updated-resource',
        parentId: null,
        sortOrder: 0,
        description: '更新描述',
        suffix: ''
      }
      
      await wrapper.vm.handleSubmit()
      
      expect(mockUpdateResource).toHaveBeenCalled()
      expect(mockMessage.success).toHaveBeenCalled()
    })

    it('should show error message when create fails', async () => {
      mockCreateResource.mockRejectedValue(new Error('创建失败'))
      
      wrapper.vm.formData = {
        name: '新资源',
        type: 1,
        path: '/new-resource',
        parentId: null,
        sortOrder: 0,
        description: '测试描述',
        suffix: ''
      }
      
      await wrapper.vm.handleSubmit()
      
      expect(mockMessage.error).toHaveBeenCalled()
    })
  })

  describe('Parent Resource Loading', () => {
    it('should load parent resources on mount', async () => {
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockGetResources).toHaveBeenCalled()
    })
  })

  describe('Form Mode Detection', () => {
    it('should be in create mode by default', () => {
      expect(wrapper.vm.isEditMode).toBe(false)
    })
  })
})
