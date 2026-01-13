package com.esmanage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

/**
 * 节点信息 DTO
 * 对应 Kibana API: /api/monitoring/v1/clusters/{clusterId}/elasticsearch/nodes
 */
@Data
public class NodeInfoDTO {

    /** 节点名称 */
    private String name;

    /** 节点 UUID */
    private String uuid;

    /** 是否在线 */
    private Boolean isOnline;

    /** 分片数量 */
    private Integer shardCount;

    /** 传输地址 */
    @JsonProperty("transport_address")
    private String transportAddress;

    /** 节点类型: master/node */
    private String type;

    /** 节点类型标签（中文） */
    private String nodeTypeLabel;

    /** 节点类型图标类名 */
    private String nodeTypeClass;

    /** 节点角色列表 */
    private List<String> roles;

    /** 解析器标识 */
    private String resolver;

    // ========== 指标数据 ==========

    /** Cgroup CPU 限制 */
    @JsonProperty("node_cgroup_throttled")
    private NodeMetricDTO nodeCgroupThrottled;

    /** CPU 使用率 */
    @JsonProperty("node_cpu_utilization")
    private NodeMetricDTO nodeCpuUtilization;

    /** 系统负载（1分钟） */
    @JsonProperty("node_load_average")
    private NodeMetricDTO nodeLoadAverage;

    /** JVM 堆内存使用率 */
    @JsonProperty("node_jvm_mem_percent")
    private NodeMetricDTO nodeJvmMemPercent;

    /** 磁盘可用空间 */
    @JsonProperty("node_free_space")
    private NodeMetricDTO nodeFreeSpace;
}
