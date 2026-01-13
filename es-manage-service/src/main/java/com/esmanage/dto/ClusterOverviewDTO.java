package com.esmanage.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 集群概览 DTO
 * 对应 Kibana API: /api/monitoring/v1/clusters/{clusterId}/elasticsearch
 */
@Data
public class ClusterOverviewDTO {

    /** 集群状态 */
    private ClusterStatusDTO clusterStatus;

    /** 指标时序数据 */
    private MetricsDTO metrics;

    /** 日志信息 */
    private LogsDTO logs;

    /** 分片活动 */
    private List<Object> shardActivity;

    /**
     * 指标数据
     */
    @Data
    public static class MetricsDTO {
        /** 集群搜索请求速率 */
        private List<TimeSeriesDataDTO> cluster_search_request_rate;

        /** 集群查询延迟 */
        private List<TimeSeriesDataDTO> cluster_query_latency;

        /** 集群索引请求速率 */
        private List<TimeSeriesDataDTO> cluster_index_request_rate;

        /** 集群索引延迟 */
        private List<TimeSeriesDataDTO> cluster_index_latency;
    }

    /**
     * 日志信息
     */
    @Data
    public static class LogsDTO {
        /** 是否启用 */
        private Boolean enabled;
        /** 日志列表 */
        private List<Object> logs;
        /** 原因 */
        private Map<String, Object> reason;
        /** 限制数量 */
        private Integer limit;
    }
}
