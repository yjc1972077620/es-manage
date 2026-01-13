package com.esmanage.dto;

import lombok.Data;
import java.util.List;

/**
 * 集群状态 DTO
 * 对应 Kibana API: /api/monitoring/v1/clusters/{clusterId}/elasticsearch
 */
@Data
public class ClusterStatusDTO {

    /** 集群健康状态: green/yellow/red */
    private String status;

    /** 索引总数 */
    private Integer indicesCount;

    /** 文档总数 */
    private Long documentCount;

    /** 数据大小（字节） */
    private Long dataSize;

    /** 节点总数 */
    private Integer nodesCount;

    /** 集群运行时间（毫秒） */
    private Long upTime;

    /** ES 版本列表 */
    private List<String> version;

    /** 已用内存（字节） */
    private Long memUsed;

    /** 最大内存（字节） */
    private Long memMax;

    /** 未分配分片数 */
    private Integer unassignedShards;

    /** 总分片数 */
    private Integer totalShards;
}
