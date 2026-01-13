# ES Monitor Web 项目

ES Monitor Web 是一个专为 Elasticsearch 集群设计的监控管理平台，提供全方位的集群监控、智能告警、审批流程和自动化操作流功能。

## 项目结构

```
es-manage/
├── es-manage-web/          # 前端项目 (React + TypeScript)
├── es-manage-service/      # 后端项目 (Spring Boot + Java)
└── docs/                   # 项目文档
```

## 技术栈

### 前端 (es-manage-web)
- **框架**: React 18 + TypeScript 5.x
- **构建工具**: Vite
- **UI 框架**: Ant Design 5.x + Tailwind CSS
- **图表库**: ECharts
- **路由**: React Router 6

### 后端 (es-manage-service)
- **框架**: Spring Boot 3.2
- **语言**: Java 17
- **构建工具**: Gradle
- **HTTP 客户端**: OkHttp 4.x

## 快速开始

### 前端开发

```bash
cd es-manage-web
npm install
npm run dev
# 访问 http://localhost:5173
```

### 后端开发

```bash
cd es-manage-service
./gradlew bootRun --console=plain
# 服务运行在 http://localhost:8080
```

## 功能模块

- **监控模块**: 集群概览、节点管理、索引监控
- **告警模块**: 告警规则、告警记录、通知渠道
- **审批模块**: 审批流程、申请管理
- **操作流模块**: 自动化操作流程
- **管理模块**: 索引管理、开发工具

## 文档

详细文档请查看 `es-manage-web/docs/` 目录：

- [产品文档](es-manage-web/docs/产品文档.md) - 面向产品经理和用户
- [开发文档](es-manage-web/docs/开发文档.md) - 面向开发人员
- [技术委员会文档](es-manage-web/docs/技术委员会文档.md) - 面向技术决策者

## 配置说明

### Kibana 连接配置

后端服务需要连接到 Kibana Monitoring API，请在 `es-manage-service/src/main/resources/application.yml` 中配置：

```yaml
kibana:
  base-url: http://your-kibana-host:5601
  username: your-username
  password: your-password
  cluster-id: your-cluster-id
```

## 开发规范

- 前端使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 中文注释和界面
- 遵循 Ant Design 设计规范
- 后端 DTO 字段需要中文注释

## 许可证

MIT License