package com.esmanage.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 节点详情 DTO
 * 对应 Kibana API: /api/monitoring/v1/clusters/{clusterId}/elasticsearch/nodes/{nodeId}
 */
@Data
public class NodeDetailDTO {

    /** 节点摘要信息 */
    private NodeSummaryDTO nodeSummary;

    /** 指标时序数据 */
    private Map<String, List<TimeSeriesDataDTO>> metrics;

    /**
     * 节点摘要
     */
    @Data
    public static class NodeSummaryDTO {
        /** 解析器标识 */
        private String resolver;

        /** 节点 ID 列表 */
        private List<String> node_ids;

        /** 传输地址 */
        private String transport_address;

        /** 节点名称 */
        private String name;

        /** 节点类型: master/node */
        private String type;

        /** 节点类型标签（中文） */
        private String nodeTypeLabel;

        /** 节点类型图标类名 */
        private String nodeTypeClass;

        /** 总分片数 */
        private Integer totalShards;

        /** 索引数量 */
        private Integer indexCount;

        /** 文档数量 */
        private Long documents;

        /** 数据大小（字节） */
        private Long dataSize;

        /** 可用磁盘空间（字节） */
        private Long freeSpace;

        /** 总磁盘空间（字节） */
        private Long totalSpace;

        /** 已用堆内存百分比 */
        private Integer usedHeap;

        /** 状态描述 */
        private String status;

        /** 是否在线 */
        private Boolean isOnline;
    }
}
