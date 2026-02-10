<template>
  <div class="bbox-verify-demo">
    <div ref="containerRef" class="graph-container"></div>
    <div class="result-panel">
      <h3>X6 坐标系统验证结果</h3>
      <div class="result-section">
        <h4>Q1: node.getBBox() 坐标系验证</h4>
        <pre>{{ q1Result }}</pre>
      </div>
      <div class="result-section">
        <h4>Q2: Graph.getCellsBBox() 坐标系验证</h4>
        <pre>{{ q2Result }}</pre>
      </div>
      <div class="result-section">
        <h4>Q3: 容器移动子节点跟随验证</h4>
        <pre>{{ q3Result }}</pre>
      </div>
      <div class="result-section">
        <h4>Q4: container.resize() 锚点验证</h4>
        <pre>{{ q4Result }}</pre>
      </div>
      <div class="actions">
        <el-button type="primary" @click="runVerification">运行验证</el-button>
        <el-button @click="clearGraph">清空画布</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Graph } from '@antv/x6'

const containerRef = ref<HTMLDivElement>()
let graph: Graph | null = null

const q1Result = ref('')
const q2Result = ref('')
const q3Result = ref('')
const q4Result = ref('')

onMounted(() => {
  // 初始化画布
  graph = new Graph({
    container: containerRef.value!,
    width: 800,
    height: 600,
    grid: {
      size: 10,
      visible: true
    },
    background: {
      color: '#f5f5f5'
    }
  })
})

const runVerification = () => {
  if (!graph) return

  // 清空画布
  graph.clearCells()

  // Q1 验证：node.getBBox() 坐标系
  verifyQ1()

  // Q2 验证：Graph.getCellsBBox() 坐标系
  verifyQ2()

  // Q3 验证：容器移动子节点跟随
  verifyQ3()

  // Q4 验证：resize() 锚点
  verifyQ4()
}

/**
 * Q1: 验证 node.getBBox() 返回的坐标系
 */
const verifyQ1 = () => {
  if (!graph) return

  const container = graph.addNode({
    shape: 'rect',
    x: 100,
    y: 100,
    width: 300,
    height: 300,
    attrs: {
      body: {
        fill: '#e3f2fd',
        stroke: '#1976d2'
      },
      label: {
        text: '容器',
        fill: '#1976d2'
      }
    }
  })

  const child = graph.addNode({
    shape: 'rect',
    x: 150,
    y: 150,
    width: 50,
    height: 50,
    attrs: {
      body: {
        fill: '#fff3e0',
        stroke: '#f57c00'
      },
      label: {
        text: '子节点',
        fill: '#f57c00',
        fontSize: 12
      }
    }
  })

  container.addChild(child)

  const containerPos = container.getPosition()
  const childPos = child.getPosition()
  const childBBox = child.getBBox()

  q1Result.value = `容器 position: { x: ${containerPos.x}, y: ${containerPos.y} }
子节点 position: { x: ${childPos.x}, y: ${childPos.y} }（已知是绝对坐标）
子节点 getBBox: { x: ${childBBox.x}, y: ${childBBox.y}, width: ${childBBox.width}, height: ${childBBox.height} }

【结论】：
- 如果 getBBox.x = 150，则返回绝对坐标（与 getPosition 一致）
- 如果 getBBox.x = 50，则返回相对坐标（150 - 100 = 50）
- 实际结果：getBBox 返回的是${childBBox.x === childPos.x ? '绝对坐标' : '相对坐标'}
`
}

/**
 * Q2: 验证 Graph.getCellsBBox() 坐标系
 */
const verifyQ2 = () => {
  if (!graph) return

  graph.clearCells()

  const container = graph.addNode({
    shape: 'rect',
    x: 100,
    y: 100,
    width: 500,
    height: 500,
    attrs: {
      body: {
        fill: '#f3e5f5',
        stroke: '#7b1fa2'
      },
      label: {
        text: '容器',
        fill: '#7b1fa2'
      }
    }
  })

  const child1 = graph.addNode({
    shape: 'rect',
    x: 150,
    y: 150,
    width: 50,
    height: 50,
    attrs: {
      body: {
        fill: '#ffebee',
        stroke: '#c62828'
      },
      label: {
        text: 'C1',
        fill: '#c62828',
        fontSize: 12
      }
    }
  })

  const child2 = graph.addNode({
    shape: 'rect',
    x: 250,
    y: 250,
    width: 50,
    height: 50,
    attrs: {
      body: {
        fill: '#e8f5e9',
        stroke: '#2e7d32'
      },
      label: {
        text: 'C2',
        fill: '#2e7d32',
        fontSize: 12
      }
    }
  })

  container.addChild(child1)
  container.addChild(child2)

  const unionBBox = graph.getCellsBBox([child1, child2])!

  q2Result.value = `容器 position: { x: 100, y: 100 }
子节点1 position: { x: 150, y: 150 }
子节点2 position: { x: 250, y: 250 }

并集包围盒 getCellsBBox: 
{ x: ${unionBBox.x}, y: ${unionBBox.y}, width: ${unionBBox.width}, height: ${unionBBox.height} }

【预期】：
- width = 150（250 + 50 - 150）
- height = 150（250 + 50 - 150）

【坐标系判断】：
- 如果 x = 150, y = 150，则返回绝对坐标
- 如果 x = 50, y = 50，则返回相对坐标（相对于容器）

【实际结果】：getCellsBBox 返回的是${unionBBox.x === 150 ? '绝对坐标' : '相对坐标'}
`
}

/**
 * Q3: 验证容器移动子节点跟随
 */
const verifyQ3 = () => {
  if (!graph) return

  graph.clearCells()

  const container = graph.addNode({
    shape: 'rect',
    x: 100,
    y: 100,
    width: 300,
    height: 300,
    attrs: {
      body: {
        fill: '#fff9c4',
        stroke: '#f57f17'
      },
      label: {
        text: '容器',
        fill: '#f57f17'
      }
    }
  })

  const child = graph.addNode({
    shape: 'rect',
    x: 150,
    y: 150,
    width: 50,
    height: 50,
    attrs: {
      body: {
        fill: '#b2dfdb',
        stroke: '#00695c'
      },
      label: {
        text: '子节点',
        fill: '#00695c',
        fontSize: 12
      }
    }
  })

  container.addChild(child)

  const beforeContainerPos = container.getPosition()
  const beforeChildPos = child.getPosition()

  // 关键：使用 translate() 而非 setPosition()
  // translate() 是 X6 官方推荐的移动方法，会触发子节点跟随
  container.translate(-20, -20)

  const afterContainerPos = container.getPosition()
  const afterChildPos = child.getPosition()

  const childMoved = beforeChildPos.x !== afterChildPos.x || beforeChildPos.y !== afterChildPos.y

  q3Result.value = `移动前：
- 容器 position: { x: ${beforeContainerPos.x}, y: ${beforeContainerPos.y} }
- 子节点 position: { x: ${beforeChildPos.x}, y: ${beforeChildPos.y} }

执行：container.translate(-20, -20)  // 向左上移动 20px

移动后：
- 容器 position: { x: ${afterContainerPos.x}, y: ${afterContainerPos.y} }
- 子节点 position: { x: ${afterChildPos.x}, y: ${afterChildPos.y} }

【结论】：
- 容器偏移量：{ dx: ${afterContainerPos.x - beforeContainerPos.x}, dy: ${afterContainerPos.y - beforeContainerPos.y} }
- 子节点${childMoved ? '自动跟随移动' : '坐标未变（视觉上飞出容器）'}
- 子节点偏移量：{ dx: ${afterChildPos.x - beforeChildPos.x}, dy: ${afterChildPos.y - beforeChildPos.y} }

【官方文档说明】：
“当移动父节点时子节点也会跟着移动。实际上，即便子节点位于父节点外部，
移动父节点时子节点也将跟着移动。”
来源：https://x6.antv.vision/zh/docs/tutorial/basic/group
`
}

/**
 * Q4: 验证 container.resize() 的锚点
 */
const verifyQ4 = () => {
  if (!graph) return

  graph.clearCells()

  const container = graph.addNode({
    shape: 'rect',
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    attrs: {
      body: {
        fill: '#fce4ec',
        stroke: '#c2185b'
      },
      label: {
        text: '容器',
        fill: '#c2185b'
      }
    }
  })

  const beforePos = container.getPosition()
  const beforeSize = container.getSize()

  // 调整尺寸
  container.resize(300, 300)

  const afterPos = container.getPosition()
  const afterSize = container.getSize()

  const posChanged = beforePos.x !== afterPos.x || beforePos.y !== afterPos.y

  q4Result.value = `调整前：
- position: { x: ${beforePos.x}, y: ${beforePos.y} }
- size: { width: ${beforeSize.width}, height: ${beforeSize.height} }

执行：container.resize(300, 300)

调整后：
- position: { x: ${afterPos.x}, y: ${afterPos.y} }
- size: { width: ${afterSize.width}, height: ${afterSize.height} }

【结论】：
- 位置${posChanged ? '发生变化' : '未变化'}
- 如果位置未变化，说明锚点在左上角（默认 direction: 'bottom-right'）
- 如果位置变化，说明锚点在其他位置（如中心点）

【实际结果】：resize() 的默认锚点在${posChanged ? '中心或其他位置' : '左上角'}

【官方文档说明】：
- resize() 的 direction 参数默认为 'bottom-right'
- 表示左上角固定，往右下角改变节点大小
`
}

const clearGraph = () => {
  if (!graph) return
  graph.clearCells()
  q1Result.value = ''
  q2Result.value = ''
  q3Result.value = ''
  q4Result.value = ''
}
</script>

<style scoped lang="scss">
.bbox-verify-demo {
  display: flex;
  height: 100vh;
  gap: 20px;
  padding: 20px;
  background-color: #fafafa;
}

.graph-container {
  flex: 1;
  border: 2px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
}

.result-panel {
  width: 500px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;

  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #1976d2;
    font-size: 18px;
    border-bottom: 2px solid #1976d2;
    padding-bottom: 10px;
  }

  .result-section {
    margin-bottom: 24px;

    h4 {
      color: #333;
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    pre {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
      border-left: 3px solid #1976d2;
    }
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #eee;
  }
}
</style>
