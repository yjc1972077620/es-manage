package com.esmanage.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 监控概览 DTO
 * 整合集群状态和关键指标
 */
@Data
public class MonitoringOverviewDTO {

    /** 集群信息 */
    private ClusterInfo cluster;

    /** 节点统计 */
    private NodesInfo nodes;

    /** 索引统计 */
    private IndicesInfo indices;

    /** 分片统计 */
    private ShardsInfo shards;

    /** JVM 统计 */
    private JvmInfo jvm;

    /** 操作系统统计 */
    private OsInfo os;

    /** 文件系统统计 */
    private FsInfo fs;

    /** 时序图表数据 */
    private Map<String, List<TimeSeriesPointDTO>> timeSeries;

    @Data
    public static class ClusterInfo {
        /** 集群名称 */
        private String name;
        /** 集群 UUID */
        private String uuid;
        /** 集群状态: green/yellow/red */
        private String status;
        /** ES 版本 */
        private String version;
        /** 运行时间（毫秒） */
        private Long upTime;
    }

    @Data
    public static class NodesInfo {
        /** 节点总数 */
        private Integer total;
        /** 成功响应节点数 */
        private Integer successful;
        /** 数据节点数 */
        private Integer data;
        /** 主节点数 */
        private Integer master;
    }

    @Data
    public static class IndicesInfo {
        /** 索引总数 */
        private Integer total;
        /** 文档总数 */
        private Long docs;
        /** 存储大小（字节） */
        private Long storeSizeBytes;
    }

    @Data
    public static class ShardsInfo {
        /** 总分片数 */
        private Integer total;
        /** 主分片数 */
        private Integer primaries;
        /** 未分配分片数 */
        private Integer unassigned;
        /** 迁移中分片数 */
        private Integer relocating;
        /** 初始化中分片数 */
        private Integer initializing;
    }

    @Data
    public static class JvmInfo {
        /** 堆内存使用百分比 */
        private Integer heapUsedPercent;
        /** 已用堆内存（字节） */
        private Long heapUsedBytes;
        /** 最大堆内存（字节） */
        private Long heapMaxBytes;
    }

    @Data
    public static class OsInfo {
        /** CPU 使用百分比 */
        private Integer cpuPercent;
        /** 内存使用百分比 */
        private Integer memUsedPercent;
    }

    @Data
    public static class FsInfo {
        /** 总磁盘空间（字节） */
        private Long totalBytes;
        /** 可用磁盘空间（字节） */
        private Long availableBytes;
        /** 磁盘使用百分比 */
        private Integer usedPercent;
    }
}
