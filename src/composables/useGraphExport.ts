import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useGraphStore } from '@/stores/graphStore'

export type ExportFormat = 'png' | 'jpeg' | 'svg'

export interface ExportOptions {
  format?: ExportFormat
  fileName?: string
  width?: number
  height?: number
  ratio?: number
  backgroundColor?: string
  padding?: number
  quality?: number
  preserveDimensions?: boolean
  copyStyles?: boolean
  serializeImages?: boolean
}

export function useGraphExport() {
  const graphStore = useGraphStore()
  const isExporting = ref(false)

  const getGraph = () => {
    return graphStore.graph
  }

  const generateFileName = (format: string) => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10).replace(/-/g, '')
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
    return `graph-${date}-${time}.${format}`
  }

  const exportAsPNG = async (options: ExportOptions = {}) => {
    const graph = getGraph()
    if (!graph) {
      ElMessage.error('画布未初始化')
      return
    }

    if (isExporting.value) {
      ElMessage.warning('正在导出中，请稍候...')
      return
    }

    isExporting.value = true

    try {
      const fileName = options.fileName || generateFileName('png')
      
      const container = document.querySelector('.graph-canvas-container') as HTMLElement
      const width = options.width ?? container?.offsetWidth ?? 800
      const height = options.height ?? container?.offsetHeight ?? 600

      const exportOptions: any = {
        backgroundColor: options.backgroundColor || '#ffffff',
        quality: options.quality || 0.92,
        copyStyles: options.copyStyles !== false,
        serializeImages: options.serializeImages !== false,
        width,
        height,
      }

      if (options.padding !== undefined) exportOptions.padding = options.padding
      if (options.ratio !== undefined) exportOptions.ratio = options.ratio

      console.log('[useGraphExport] PNG 导出配置:', exportOptions)
      await graph.exportPNG(fileName, exportOptions)
      ElMessage.success('导出成功！文件已保存为 ' + fileName)
    } catch (error) {
      console.error('[useGraphExport] PNG 导出失败:', error)
      ElMessage.error('PNG 导出失败，请重试')
    } finally {
      isExporting.value = false
    }
  }

  const exportAsJPEG = async (options: ExportOptions = {}) => {
    const graph = getGraph()
    if (!graph) {
      ElMessage.error('画布未初始化')
      return
    }

    if (isExporting.value) {
      ElMessage.warning('正在导出中，请稍候...')
      return
    }

    isExporting.value = true

    try {
      const fileName = options.fileName || generateFileName('jpeg')
      
      const container = document.querySelector('.graph-canvas-container') as HTMLElement
      const width = options.width ?? container?.offsetWidth ?? 800
      const height = options.height ?? container?.offsetHeight ?? 600

      const exportOptions: any = {
        backgroundColor: options.backgroundColor || '#ffffff',
        quality: options.quality || 0.92,
        copyStyles: options.copyStyles !== false,
        serializeImages: options.serializeImages !== false,
        width,
        height,
      }

      if (options.padding !== undefined) exportOptions.padding = options.padding
      if (options.ratio !== undefined) exportOptions.ratio = options.ratio

      console.log('[useGraphExport] JPEG 导出配置:', exportOptions)
      await graph.exportJPEG(fileName, exportOptions)
      ElMessage.success('导出成功！文件已保存为 ' + fileName)
    } catch (error) {
      console.error('[useGraphExport] JPEG 导出失败:', error)
      ElMessage.error('JPEG 导出失败，请重试')
    } finally {
      isExporting.value = false
    }
  }

  const exportAsSVG = async (options: ExportOptions = {}) => {
    const graph = getGraph()
    if (!graph) {
      ElMessage.error('画布未初始化')
      return
    }

    if (isExporting.value) {
      ElMessage.warning('正在导出中，请稍候...')
      return
    }

    isExporting.value = true

    try {
      const fileName = options.fileName || generateFileName('svg')
      
      const container = document.querySelector('.graph-canvas-container') as HTMLElement
      const width = options.width ?? container?.offsetWidth ?? 800
      const height = options.height ?? container?.offsetHeight ?? 600

      const exportOptions: any = {
        copyStyles: options.copyStyles !== false,
        serializeImages: options.serializeImages !== false,
        preserveDimensions: { width, height },
      }

      console.log('[useGraphExport] SVG 导出配置:', exportOptions)
      await graph.exportSVG(fileName, exportOptions)
      ElMessage.success('导出成功！文件已保存为 ' + fileName)
    } catch (error) {
      console.error('[useGraphExport] SVG 导出失败:', error)
      ElMessage.error('SVG 导出失败，请重试')
    } finally {
      isExporting.value = false
    }
  }

  const exportImage = async (format: ExportFormat, options: ExportOptions = {}) => {
    switch (format) {
      case 'png':
        await exportAsPNG(options)
        break
      case 'jpeg':
        await exportAsJPEG(options)
        break
      case 'svg':
        await exportAsSVG(options)
        break
      default:
        ElMessage.error('不支持的导出格式')
    }
  }

  return {
    isExporting,
    exportAsPNG,
    exportAsJPEG,
    exportAsSVG,
    exportImage,
  }
}
