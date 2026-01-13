package com.esmanage.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 索引详情 DTO
 * 对应 Kibana
 * /api/monitoring/v1/clusters/{clusterId}/elasticsearch/indices/{indexName} 接口
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class IndexDetailDTO {

    /** 索引摘要信息 */
    private IndexSummary indexSummary;

    /** 指标时序数据 */
    private Map<String, List<TimeSeriesDataDTO>> metrics;

    /** 分片信息 */
    private List<ShardInfo> shards;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IndexSummary {
        /** 索引名称 */
        private String name;
        /** 健康状态 */
        private String status;
        /** 主分片数 */
        private Integer primaries;
        /** 副本数 */
        private Integer replicas;
        /** 文档数 */
        private Long documents;
        /** 数据大小 - Kibana 返回的是对象 */
        private DataSize dataSize;
        /** 未分配分片数 */
        private Integer unassignedShards;
        /** 总分片数 */
        private Integer totalShards;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DataSize {
        /** 主分片大小（字节） */
        private Long primaries;
        /** 总大小（字节） */
        private Long total;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ShardInfo {
        /** 分片所属索引名称 */
        private String index;
        /** 分片编号 */
        private Integer shard;
        /** 节点名称 */
        private String node;
        /** 是否主分片 */
        private Boolean primary;
        /** 迁移节点 */
        private String relocatingNode;
        /** 分片状态 */
        private String state;
    }
}
