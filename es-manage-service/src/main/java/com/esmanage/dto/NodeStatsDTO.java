package com.esmanage.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 节点统计 DTO
 * 包含节点的详细统计信息
 */
@Data
public class NodeStatsDTO {

    /** 节点名称 */
    private String name;

    /** 节点 UUID */
    private String uuid;

    /** 传输地址 */
    private String transportAddress;

    /** 主机名 */
    private String host;

    /** IP 地址 */
    private String ip;

    /** ES 版本 */
    private String version;

    /** 节点角色列表 */
    private List<String> roles;

    /** 是否是当前主节点 */
    private Boolean isMaster;

    /** 是否在线 */
    private Boolean isOnline;

    /** 分片数量 */
    private Integer shardCount;

    /** 节点类型标签 */
    private String nodeTypeLabel;

    /** 操作系统统计 */
    private OsStats os;

    /** JVM 统计 */
    private JvmStats jvm;

    /** 文件系统统计 */
    private FsStats fs;

    /** 索引统计 */
    private IndicesStats indices;

    /** 线程池统计 */
    private Map<String, ThreadPoolStats> threadPool;

    /** 断路器统计 */
    private Map<String, BreakerStats> breakers;

    @Data
    public static class OsStats {
        /** 时间戳 */
        private Long timestamp;
        /** CPU 统计 */
        private CpuStats cpu;
        /** 内存统计 */
        private MemStats mem;
        /** 交换分区统计 */
        private SwapStats swap;

        @Data
        public static class CpuStats {
            /** CPU 使用百分比 */
            private Integer percent;
            /** 负载平均值 */
            private LoadAverage loadAverage;

            @Data
            public static class LoadAverage {
                /** 1分钟负载 */
                private Double oneMinute;
                /** 5分钟负载 */
                private Double fiveMinutes;
                /** 15分钟负载 */
                private Double fifteenMinutes;
            }
        }

        @Data
        public static class MemStats {
            /** 总内存（字节） */
            private Long totalInBytes;
            /** 已用内存（字节） */
            private Long usedInBytes;
            /** 可用内存（字节） */
            private Long freeInBytes;
            /** 已用百分比 */
            private Integer usedPercent;
            /** 可用百分比 */
            private Integer freePercent;
        }

        @Data
        public static class SwapStats {
            /** 总交换空间（字节） */
            private Long totalInBytes;
            /** 已用交换空间（字节） */
            private Long usedInBytes;
            /** 可用交换空间（字节） */
            private Long freeInBytes;
        }
    }

    @Data
    public static class JvmStats {
        /** 时间戳 */
        private Long timestamp;
        /** 运行时间（毫秒） */
        private Long uptimeInMillis;
        /** 内存统计 */
        private MemStats mem;
        /** 线程统计 */
        private ThreadStats threads;
        /** GC 统计 */
        private GcStats gc;

        @Data
        public static class MemStats {
            /** 已用堆内存（字节） */
            private Long heapUsedInBytes;
            /** 已用堆内存百分比 */
            private Integer heapUsedPercent;
            /** 已提交堆内存（字节） */
            private Long heapCommittedInBytes;
            /** 最大堆内存（字节） */
            private Long heapMaxInBytes;
            /** 已用非堆内存（字节） */
            private Long nonHeapUsedInBytes;
            /** 已提交非堆内存（字节） */
            private Long nonHeapCommittedInBytes;
        }

        @Data
        public static class ThreadStats {
            /** 线程数 */
            private Integer count;
            /** 峰值线程数 */
            private Integer peakCount;
        }

        @Data
        public static class GcStats {
            /** GC 收集器统计 */
            private Map<String, CollectorStats> collectors;

            @Data
            public static class CollectorStats {
                /** 收集次数 */
                private Long collectionCount;
                /** 收集时间（毫秒） */
                private Long collectionTimeInMillis;
            }
        }
    }

    @Data
    public static class FsStats {
        /** 时间戳 */
        private Long timestamp;
        /** 总计 */
        private TotalStats total;

        @Data
        public static class TotalStats {
            /** 总空间（字节） */
            private Long totalInBytes;
            /** 可用空间（字节） */
            private Long freeInBytes;
            /** 可用空间（字节） */
            private Long availableInBytes;
        }
    }

    @Data
    public static class IndicesStats {
        /** 文档统计 */
        private DocsStats docs;
        /** 存储统计 */
        private StoreStats store;
        /** 索引操作统计 */
        private IndexingStats indexing;
        /** 搜索操作统计 */
        private SearchStats search;
        /** 段统计 */
        private SegmentsStats segments;

        @Data
        public static class DocsStats {
            /** 文档数 */
            private Long count;
            /** 已删除文档数 */
            private Long deleted;
        }

        @Data
        public static class StoreStats {
            /** 存储大小（字节） */
            private Long sizeInBytes;
        }

        @Data
        public static class IndexingStats {
            /** 索引总数 */
            private Long indexTotal;
            /** 索引时间（毫秒） */
            private Long indexTimeInMillis;
            /** 当前索引数 */
            private Integer indexCurrent;
            /** 索引失败数 */
            private Long indexFailed;
            /** 删除总数 */
            private Long deleteTotal;
            /** 删除时间（毫秒） */
            private Long deleteTimeInMillis;
            /** 当前删除数 */
            private Integer deleteCurrent;
            /** 是否限流 */
            private Boolean isThrottled;
            /** 限流时间（毫秒） */
            private Long throttleTimeInMillis;
        }

        @Data
        public static class SearchStats {
            /** 打开的上下文数 */
            private Integer openContexts;
            /** 查询总数 */
            private Long queryTotal;
            /** 查询时间（毫秒） */
            private Long queryTimeInMillis;
            /** 当前查询数 */
            private Integer queryCurrent;
            /** 获取总数 */
            private Long fetchTotal;
            /** 获取时间（毫秒） */
            private Long fetchTimeInMillis;
            /** 当前获取数 */
            private Integer fetchCurrent;
            /** 滚动查询总数 */
            private Long scrollTotal;
            /** 滚动查询时间（毫秒） */
            private Long scrollTimeInMillis;
            /** 当前滚动查询数 */
            private Integer scrollCurrent;
        }

        @Data
        public static class SegmentsStats {
            /** 段数量 */
            private Integer count;
            /** 内存大小（字节） */
            private Long memoryInBytes;
        }
    }

    @Data
    public static class ThreadPoolStats {
        /** 线程数 */
        private Integer threads;
        /** 队列大小 */
        private Integer queue;
        /** 活跃线程数 */
        private Integer active;
        /** 拒绝数 */
        private Long rejected;
        /** 最大线程数 */
        private Integer largest;
        /** 完成数 */
        private Long completed;
    }

    @Data
    public static class BreakerStats {
        /** 限制大小（字节） */
        private Long limitSizeInBytes;
        /** 限制大小（格式化） */
        private String limitSize;
        /** 估计大小（字节） */
        private Long estimatedSizeInBytes;
        /** 估计大小（格式化） */
        private String estimatedSize;
        /** 开销 */
        private Double overhead;
        /** 触发次数 */
        private Long tripped;
    }
}
