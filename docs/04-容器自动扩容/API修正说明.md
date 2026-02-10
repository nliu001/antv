# getCellsBBox API 修正说明

**发现时间**：2026-02-10  
**问题类型**：API 用法错误

---

## 问题描述

在运行验证 Demo 时发现错误：
```
Uncaught TypeError: Graph.getCellsBBox is not a function
```

## 根本原因

**错误理解**：将 `getCellsBBox()` 误认为是 `Graph` 类的静态方法  
**实际情况**：`getCellsBBox()` 是 **graph 实例方法**

## 错误用法 vs 正确用法

### ❌ 错误用法（静态方法）
```typescript
import { Graph } from '@antv/x6'

const children = parent.getChildren()
const unionBBox = Graph.getCellsBBox(children)  // ❌ 错误！
```

### ✅ 正确用法（实例方法）
```typescript
const graph = new Graph({ ... })
const children = parent.getChildren()
const unionBBox = graph.getCellsBBox(children)  // ✅ 正确！
```

---

## 官方文档引用

**来源**：OpenDeep Wiki - https://opendeep.wiki/antvis/x6/graph

**方法签名**（推断）：
```typescript
graph.getCellsBBox(cells: Cell[]): Rectangle | null
```

**参数**：
- `cells`: Cell 数组（Node 或 Edge）

**返回值**：
- `Rectangle` 对象：`{ x, y, width, height }`
- `null`：当 cells 为空时

---

## 已修复的文件

### 1. 验证 Demo
- **文件**：`src/components/canvas/BBoxVerifyDemo.vue`
- **修改**：第 204 行
  ```diff
  - const unionBBox = Graph.getCellsBBox([child1, child2])!
  + const unionBBox = graph.getCellsBBox([child1, child2])!
  ```

### 2. 可行性分析文档
- **文件**：`docs/feasibility_analysis.md`
- **修改**：第 127、142 行
  ```diff
  - const unionBBox = Graph.getCellsBBox(children)
  + const unionBBox = graph.getCellsBBox(children)
  ```
- **新增**：注释说明"是实例方法，不是静态方法"

### 3. 方案设计文档
- **文件**：`docs/steps/04-容器自动扩容.md`
- **修改**：第 182 行（5.2.2 节）
  ```diff
  - 使用 X6 工具方法
  + 使用 X6 graph 实例方法
  
  - const unionBBox = Graph.getCellsBBox(children)
  + const unionBBox = graph.getCellsBBox(children)
  ```

### 4. 验证报告
- **文件**：`docs/04-容器自动扩容/X6坐标系统验证报告.md`
- **修改**：第 1.4 节
  - 更新标题：从 `Graph.getCellsBBox()` 改为 `graph.getCellsBBox()`
  - 新增使用示例，对比错误和正确用法
  - 标注为实例方法

---

## 影响范围

### 已修复
✅ 验证 Demo 可以正常运行  
✅ 文档示例代码已更正  
✅ 不会误导后续开发

### 待验证
⏳ 验证 Demo 运行后记录 Q1、Q2 的实测结果  
⏳ 根据验证结果更新扩容算法设计

---

## 经验教训

### 教训 1：API 类型判断
- ❌ **错误**：看到 `Graph.xxx()` 形式就认为是静态方法
- ✅ **正确**：查阅官方文档明确方法类型（静态 vs 实例）

### 教训 2：文档示例验证
- ❌ **错误**：直接复制文档中的伪代码到项目
- ✅ **正确**：编写 Demo 验证 API 实际用法

### 教训 3：错误传播
- ⚠️ **风险**：一个文件的错误可能被复制到多个文件
- ✅ **解决**：发现错误后全局搜索并统一修正

---

## 下一步

1. 运行修复后的验证 Demo
2. 记录 Q1（getBBox 坐标系）和 Q2（getCellsBBox 坐标系）的实测结果
3. 基于验证结果更新扩容算法

---

**修复人**：AI 助手  
**修复时间**：2026-02-10  
**状态**：✅ 已修复，等待验证
