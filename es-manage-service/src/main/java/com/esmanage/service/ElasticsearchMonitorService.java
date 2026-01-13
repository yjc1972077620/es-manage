package com.esmanage.service;

import com.esmanage.client.KibanaClient;
import com.esmanage.dto.*;
import com.esmanage.dto.request.IndicesRequest;
import com.esmanage.dto.request.NodesRequest;
import com.esmanage.dto.request.TimeRangeRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

/**
 * Elasticsearch 监控服务
 * 封装对 Kibana Monitoring API 的调用
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ElasticsearchMonitorService {

    private final KibanaClient kibanaClient;

    /**
     * 获取集群概览数据
     *
     * @param timeRange 时间范围
     * @return 集群概览
     */
    public ClusterOverviewDTO getClusterOverview(TimeRangeRequest timeRange) throws IOException {
        String path = String.format("/api/monitoring/v1/clusters/%s/elasticsearch",
                kibanaClient.getClusterId());

        Map<String, Object> body = new HashMap<>();
        body.put("timeRange", buildTimeRange(timeRange));

        return kibanaClient.post(path, body, ClusterOverviewDTO.class);
    }

    /**
     * 获取节点列表
     *
     * @param request 请求参数
     * @return 节点列表响应
     */
    public NodesResponseDTO getNodes(NodesRequest request) throws IOException {
        String path = String.format("/api/monitoring/v1/clusters/%s/elasticsearch/nodes",
                kibanaClient.getClusterId());

        Map<String, Object> body = new HashMap<>();
        body.put("timeRange", buildTimeRange(request.getTimeRange()));
        body.put("pagination", buildPagination(request.getPagination()));

        return kibanaClient.post(path, body, NodesResponseDTO.class);
    }

    /**
     * 获取节点详情
     *
     * @param nodeId    节点 ID
     * @param timeRange 时间范围
     * @return 节点详情
     */
    public NodeDetailDTO getNodeDetail(String nodeId, TimeRangeRequest timeRange) throws IOException {
        String path = String.format("/api/monitoring/v1/clusters/%s/elasticsearch/nodes/%s",
                kibanaClient.getClusterId(), nodeId);

        Map<String, Object> body = new HashMap<>();
        body.put("timeRange", buildTimeRange(timeRange));
        body.put("is_advanced", false);

        return kibanaClient.post(path, body, NodeDetailDTO.class);
    }

    /**
     * 获取索引列表
     *
     * @param request 请求参数
     * @return 索引列表响应
     */
    public IndicesResponseDTO getIndices(IndicesRequest request) throws IOException {
        String path = String.format("/api/monitoring/v1/clusters/%s/elasticsearch/indices?show_system_indices=%s",
                kibanaClient.getClusterId(),
                request.getShowSystemIndices() != null && request.getShowSystemIndices() ? "true" : "false");

        Map<String, Object> body = new HashMap<>();
        body.put("timeRange", buildTimeRange(request.getTimeRange()));
        body.put("pagination", buildPagination(request.getPagination()));
        body.put("queryText", request.getQueryText() != null ? request.getQueryText() : "");

        return kibanaClient.post(path, body, IndicesResponseDTO.class);
    }

    /**
     * 构建时间范围参数
     */
    private Map<String, String> buildTimeRange(TimeRangeRequest timeRange) {
        Map<String, String> range = new HashMap<>();

        if (timeRange != null && timeRange.getMin() != null && timeRange.getMax() != null) {
            range.put("min", timeRange.getMin());
            range.put("max", timeRange.getMax());
        } else {
            // 默认最近1小时
            Instant now = Instant.now();
            range.put("min", now.minus(1, ChronoUnit.HOURS).toString());
            range.put("max", now.toString());
        }

        return range;
    }

    /**
     * 构建分页参数
     */
    private Map<String, Integer> buildPagination(NodesRequest.PaginationRequest pagination) {
        Map<String, Integer> page = new HashMap<>();

        if (pagination != null) {
            page.put("index", pagination.getIndex() != null ? pagination.getIndex() : 0);
            page.put("size", pagination.getSize() != null ? pagination.getSize() : 20);
        } else {
            page.put("index", 0);
            page.put("size", 20);
        }

        return page;
    }

    /**
     * 获取监控概览数据（转换后的格式）
     * 使用并行调用优化性能
     *
     * @param timeRange 时间范围
     * @return 监控概览
     */
    public MonitoringOverviewDTO getMonitoringOverview(TimeRangeRequest timeRange) throws IOException {
        // 并行获取集群概览和节点数据
        CompletableFuture<ClusterOverviewDTO> clusterFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return getClusterOverview(timeRange);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        NodesRequest nodesRequest = new NodesRequest();
        nodesRequest.setTimeRange(timeRange);
        CompletableFuture<NodesResponseDTO> nodesFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return getNodes(nodesRequest);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        ClusterOverviewDTO clusterOverview;
        NodesResponseDTO nodesResponse;
        try {
            clusterOverview = clusterFuture.get();
            nodesResponse = nodesFuture.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new IOException("Failed to fetch monitoring data", e);
        }

        MonitoringOverviewDTO overview = new MonitoringOverviewDTO();

        // 集群信息
        ClusterStatusDTO status = clusterOverview.getClusterStatus();
        MonitoringOverviewDTO.ClusterInfo clusterInfo = new MonitoringOverviewDTO.ClusterInfo();
        clusterInfo.setName("elasticsearch"); // Kibana API 不返回集群名称，使用默认值
        clusterInfo.setUuid(kibanaClient.getClusterId());
        clusterInfo.setStatus(status.getStatus());
        clusterInfo.setVersion(status.getVersion() != null && !status.getVersion().isEmpty()
                ? status.getVersion().get(0)
                : "unknown");
        clusterInfo.setUpTime(status.getUpTime());
        overview.setCluster(clusterInfo);

        // 节点信息
        MonitoringOverviewDTO.NodesInfo nodesInfo = new MonitoringOverviewDTO.NodesInfo();
        nodesInfo.setTotal(status.getNodesCount());
        nodesInfo.setSuccessful(status.getNodesCount());
        // 统计数据节点和主节点
        int dataNodes = 0;
        int masterNodes = 0;
        if (nodesResponse.getNodes() != null) {
            for (NodeInfoDTO node : nodesResponse.getNodes()) {
                if (node.getRoles() != null) {
                    if (node.getRoles().contains("data"))
                        dataNodes++;
                    if (node.getRoles().contains("master"))
                        masterNodes++;
                }
            }
        }
        nodesInfo.setData(dataNodes);
        nodesInfo.setMaster(masterNodes);
        overview.setNodes(nodesInfo);

        // 索引信息
        MonitoringOverviewDTO.IndicesInfo indicesInfo = new MonitoringOverviewDTO.IndicesInfo();
        indicesInfo.setTotal(status.getIndicesCount());
        indicesInfo.setDocs(status.getDocumentCount());
        indicesInfo.setStoreSizeBytes(status.getDataSize());
        overview.setIndices(indicesInfo);

        // 分片信息
        MonitoringOverviewDTO.ShardsInfo shardsInfo = new MonitoringOverviewDTO.ShardsInfo();
        shardsInfo.setTotal(status.getTotalShards());
        shardsInfo.setPrimaries(status.getTotalShards() / 2); // 估算
        shardsInfo.setUnassigned(status.getUnassignedShards());
        shardsInfo.setRelocating(0);
        shardsInfo.setInitializing(0);
        overview.setShards(shardsInfo);

        // JVM 信息
        MonitoringOverviewDTO.JvmInfo jvmInfo = new MonitoringOverviewDTO.JvmInfo();
        if (status.getMemMax() != null && status.getMemMax() > 0) {
            jvmInfo.setHeapUsedPercent((int) (status.getMemUsed() * 100 / status.getMemMax()));
        } else {
            jvmInfo.setHeapUsedPercent(0);
        }
        jvmInfo.setHeapUsedBytes(status.getMemUsed());
        jvmInfo.setHeapMaxBytes(status.getMemMax());
        overview.setJvm(jvmInfo);

        // OS 信息 - 从节点数据计算平均值
        MonitoringOverviewDTO.OsInfo osInfo = new MonitoringOverviewDTO.OsInfo();
        int totalCpu = 0;
        int nodeCount = 0;
        if (nodesResponse.getNodes() != null) {
            for (NodeInfoDTO node : nodesResponse.getNodes()) {
                if (node.getNodeCpuUtilization() != null &&
                        node.getNodeCpuUtilization().getSummary() != null) {
                    Double lastVal = node.getNodeCpuUtilization().getSummary().getLastVal();
                    if (lastVal != null) {
                        totalCpu += lastVal.intValue();
                        nodeCount++;
                    }
                }
            }
        }
        osInfo.setCpuPercent(nodeCount > 0 ? totalCpu / nodeCount : 0);
        osInfo.setMemUsedPercent(jvmInfo.getHeapUsedPercent()); // 使用 JVM 内存作为近似值
        overview.setOs(osInfo);

        // 文件系统信息 - 从节点数据计算
        MonitoringOverviewDTO.FsInfo fsInfo = new MonitoringOverviewDTO.FsInfo();
        long totalSpace = 0;
        long freeSpace = 0;
        if (nodesResponse.getNodes() != null) {
            for (NodeInfoDTO node : nodesResponse.getNodes()) {
                if (node.getNodeFreeSpace() != null &&
                        node.getNodeFreeSpace().getSummary() != null) {
                    Double lastVal = node.getNodeFreeSpace().getSummary().getLastVal();
                    if (lastVal != null) {
                        freeSpace += lastVal.longValue();
                        // 估算总空间（假设使用率约 60%）
                        totalSpace += (long) (lastVal / 0.4);
                    }
                }
            }
        }
        fsInfo.setTotalBytes(totalSpace);
        fsInfo.setAvailableBytes(freeSpace);
        fsInfo.setUsedPercent(totalSpace > 0 ? (int) ((totalSpace - freeSpace) * 100 / totalSpace) : 0);
        overview.setFs(fsInfo);

        // 时序数据转换
        Map<String, List<TimeSeriesPointDTO>> timeSeries = new HashMap<>();
        if (clusterOverview.getMetrics() != null) {
            ClusterOverviewDTO.MetricsDTO metrics = clusterOverview.getMetrics();

            // 搜索速率
            if (metrics.getCluster_search_request_rate() != null
                    && !metrics.getCluster_search_request_rate().isEmpty()) {
                timeSeries.put("search_rate", convertTimeSeries(metrics.getCluster_search_request_rate().get(0)));
            }

            // 索引速率
            if (metrics.getCluster_index_request_rate() != null && !metrics.getCluster_index_request_rate().isEmpty()) {
                timeSeries.put("indexing_rate", convertTimeSeries(metrics.getCluster_index_request_rate().get(0)));
            }

            // 查询延迟
            if (metrics.getCluster_query_latency() != null && !metrics.getCluster_query_latency().isEmpty()) {
                timeSeries.put("query_latency", convertTimeSeries(metrics.getCluster_query_latency().get(0)));
            }

            // 索引延迟
            if (metrics.getCluster_index_latency() != null && !metrics.getCluster_index_latency().isEmpty()) {
                timeSeries.put("index_latency", convertTimeSeries(metrics.getCluster_index_latency().get(0)));
            }
        }
        overview.setTimeSeries(timeSeries);

        return overview;
    }

    /**
     * 获取节点详情时序数据（转换后的格式）
     *
     * @param nodeId    节点 ID
     * @param timeRange 时间范围
     * @return 时序数据 Map
     */
    public Map<String, List<TimeSeriesPointDTO>> getNodeTimeSeries(String nodeId, TimeRangeRequest timeRange)
            throws IOException {
        NodeDetailDTO detail = getNodeDetail(nodeId, timeRange);
        Map<String, List<TimeSeriesPointDTO>> result = new HashMap<>();

        if (detail.getMetrics() != null) {
            for (Map.Entry<String, List<TimeSeriesDataDTO>> entry : detail.getMetrics().entrySet()) {
                String metricName = entry.getKey();
                List<TimeSeriesDataDTO> dataList = entry.getValue();

                if (dataList != null && !dataList.isEmpty()) {
                    // 转换指标名称为前端期望的格式
                    String frontendKey = convertMetricKey(metricName);
                    result.put(frontendKey, convertTimeSeries(dataList.get(0)));
                }
            }
        }

        return result;
    }

    /**
     * 转换时序数据
     */
    private List<TimeSeriesPointDTO> convertTimeSeries(TimeSeriesDataDTO data) {
        if (data == null || data.getData() == null) {
            return Collections.emptyList();
        }

        List<TimeSeriesPointDTO> result = new ArrayList<>();
        for (List<Object> point : data.getData()) {
            if (point != null && point.size() >= 2) {
                Long timestamp = null;
                Double value = null;

                // 解析时间戳
                if (point.get(0) instanceof Number) {
                    timestamp = ((Number) point.get(0)).longValue();
                }

                // 解析值
                if (point.get(1) instanceof Number) {
                    value = ((Number) point.get(1)).doubleValue();
                }

                if (timestamp != null && value != null) {
                    result.add(new TimeSeriesPointDTO(timestamp, value));
                }
            }
        }

        return result;
    }

    /**
     * 转换指标键名
     */
    private String convertMetricKey(String kibanaKey) {
        Map<String, String> keyMapping = new HashMap<>();
        keyMapping.put("node_cpu_utilization", "cpu_percent");
        keyMapping.put("node_cpu_metric", "cpu_percent");
        keyMapping.put("node_jvm_mem", "heap_used_percent");
        keyMapping.put("node_load_average", "load_average");
        keyMapping.put("node_latency", "latency");
        keyMapping.put("node_index_mem", "index_memory");
        keyMapping.put("node_total_io", "io_operations");
        keyMapping.put("node_segment_count", "segment_count");

        return keyMapping.getOrDefault(kibanaKey, kibanaKey);
    }

    /**
     * 获取索引详情
     *
     * @param indexName 索引名称
     * @param timeRange 时间范围
     * @return 索引详情
     */
    public IndexDetailDTO getIndexDetail(String indexName, TimeRangeRequest timeRange) throws IOException {
        String path = String.format("/api/monitoring/v1/clusters/%s/elasticsearch/indices/%s",
                kibanaClient.getClusterId(), indexName);

        Map<String, Object> body = new HashMap<>();
        body.put("timeRange", buildTimeRange(timeRange));
        body.put("is_advanced", false);

        return kibanaClient.post(path, body, IndexDetailDTO.class);
    }

    /**
     * 获取索引时序数据（转换后的格式）
     *
     * @param indexName 索引名称
     * @param timeRange 时间范围
     * @return 时序数据 Map
     */
    public Map<String, List<TimeSeriesPointDTO>> getIndexTimeSeries(String indexName, TimeRangeRequest timeRange)
            throws IOException {
        IndexDetailDTO detail = getIndexDetail(indexName, timeRange);
        Map<String, List<TimeSeriesPointDTO>> result = new HashMap<>();

        if (detail.getMetrics() != null) {
            for (Map.Entry<String, List<TimeSeriesDataDTO>> entry : detail.getMetrics().entrySet()) {
                String metricName = entry.getKey();
                List<TimeSeriesDataDTO> dataList = entry.getValue();

                if (dataList != null && !dataList.isEmpty()) {
                    // 转换指标名称为前端期望的格式
                    String frontendKey = convertIndexMetricKey(metricName);
                    result.put(frontendKey, convertTimeSeries(dataList.get(0)));
                }
            }
        }

        return result;
    }

    /**
     * 转换索引指标键名
     */
    private String convertIndexMetricKey(String kibanaKey) {
        Map<String, String> keyMapping = new HashMap<>();
        keyMapping.put("index_search_request_rate", "search_rate");
        keyMapping.put("index_request_rate", "indexing_rate");
        keyMapping.put("index_latency", "query_latency");
        keyMapping.put("index_document_count", "doc_count");
        keyMapping.put("index_segment_count", "segment_count");
        keyMapping.put("index_mem", "index_memory");

        return keyMapping.getOrDefault(kibanaKey, kibanaKey);
    }
}
