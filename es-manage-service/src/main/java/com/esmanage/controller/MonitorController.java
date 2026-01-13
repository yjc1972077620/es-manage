package com.esmanage.controller;

import com.esmanage.client.KibanaClient;
import com.esmanage.dto.*;
import com.esmanage.dto.request.IndicesRequest;
import com.esmanage.dto.request.NodesRequest;
import com.esmanage.dto.request.TimeRangeRequest;
import com.esmanage.service.ElasticsearchMonitorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 监控 API 控制器
 * 提供 Elasticsearch 集群监控数据接口
 */
@Slf4j
@RestController
@RequestMapping("/api/monitor")
@RequiredArgsConstructor
public class MonitorController {

    private final ElasticsearchMonitorService monitorService;
    private final KibanaClient kibanaClient;

    /**
     * 获取集群概览（原始 Kibana 格式）
     *
     * @param minutes 时间范围（分钟），默认60分钟
     * @return 集群概览数据
     */
    @GetMapping("/cluster/overview")
    public ResponseEntity<ClusterOverviewDTO> getClusterOverview(
            @RequestParam(defaultValue = "60") Integer minutes) {
        try {
            TimeRangeRequest timeRange = buildTimeRange(minutes);
            ClusterOverviewDTO overview = monitorService.getClusterOverview(timeRange);
            return ResponseEntity.ok(overview);
        } catch (IOException e) {
            log.error("Failed to get cluster overview", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取监控概览（转换后的格式，适合前端展示）
     *
     * @param minutes 时间范围（分钟），默认60分钟
     * @return 监控概览数据
     */
    @GetMapping("/overview")
    public ResponseEntity<MonitoringOverviewDTO> getMonitoringOverview(
            @RequestParam(defaultValue = "60") Integer minutes) {
        try {
            TimeRangeRequest timeRange = buildTimeRange(minutes);
            MonitoringOverviewDTO overview = monitorService.getMonitoringOverview(timeRange);
            return ResponseEntity.ok(overview);
        } catch (IOException e) {
            log.error("Failed to get monitoring overview", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取节点时序数据
     *
     * @param nodeId  节点 ID
     * @param minutes 时间范围（分钟），默认60分钟
     * @return 时序数据
     */
    @GetMapping("/nodes/{nodeId}/timeseries")
    public ResponseEntity<Map<String, List<TimeSeriesPointDTO>>> getNodeTimeSeries(
            @PathVariable String nodeId,
            @RequestParam(defaultValue = "60") Integer minutes) {
        try {
            TimeRangeRequest timeRange = buildTimeRange(minutes);
            Map<String, List<TimeSeriesPointDTO>> timeSeries = monitorService.getNodeTimeSeries(nodeId, timeRange);
            return ResponseEntity.ok(timeSeries);
        } catch (IOException e) {
            log.error("Failed to get node time series: {}", nodeId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取集群状态
     *
     * @return 集群状态
     */
    @GetMapping("/cluster/status")
    public ResponseEntity<ClusterStatusDTO> getClusterStatus() {
        try {
            TimeRangeRequest timeRange = buildTimeRange(60);
            NodesRequest request = new NodesRequest();
            request.setTimeRange(timeRange);
            NodesResponseDTO response = monitorService.getNodes(request);
            return ResponseEntity.ok(response.getClusterStatus());
        } catch (IOException e) {
            log.error("Failed to get cluster status", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取节点列表
     *
     * @param minutes  时间范围（分钟），默认60分钟
     * @param page     页码（从0开始），默认0
     * @param pageSize 每页大小，默认20
     * @return 节点列表
     */
    @GetMapping("/nodes")
    public ResponseEntity<NodesResponseDTO> getNodes(
            @RequestParam(defaultValue = "60") Integer minutes,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        try {
            NodesRequest request = new NodesRequest();
            request.setTimeRange(buildTimeRange(minutes));

            NodesRequest.PaginationRequest pagination = new NodesRequest.PaginationRequest();
            pagination.setIndex(page);
            pagination.setSize(pageSize);
            request.setPagination(pagination);

            NodesResponseDTO response = monitorService.getNodes(request);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to get nodes", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取节点详情
     *
     * @param nodeId  节点 ID
     * @param minutes 时间范围（分钟），默认60分钟
     * @return 节点详情
     */
    @GetMapping("/nodes/{nodeId}")
    public ResponseEntity<NodeDetailDTO> getNodeDetail(
            @PathVariable String nodeId,
            @RequestParam(defaultValue = "60") Integer minutes) {
        try {
            TimeRangeRequest timeRange = buildTimeRange(minutes);
            NodeDetailDTO detail = monitorService.getNodeDetail(nodeId, timeRange);
            return ResponseEntity.ok(detail);
        } catch (IOException e) {
            log.error("Failed to get node detail: {}", nodeId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取索引列表
     *
     * @param minutes           时间范围（分钟），默认60分钟
     * @param page              页码（从0开始），默认0
     * @param pageSize          每页大小，默认20
     * @param queryText         搜索文本
     * @param showSystemIndices 是否显示系统索引
     * @return 索引列表
     */
    @GetMapping("/indices")
    public ResponseEntity<IndicesResponseDTO> getIndices(
            @RequestParam(defaultValue = "60") Integer minutes,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(defaultValue = "") String queryText,
            @RequestParam(defaultValue = "false") Boolean showSystemIndices) {
        try {
            IndicesRequest request = new IndicesRequest();
            request.setTimeRange(buildTimeRange(minutes));

            NodesRequest.PaginationRequest pagination = new NodesRequest.PaginationRequest();
            pagination.setIndex(page);
            pagination.setSize(pageSize);
            request.setPagination(pagination);

            request.setQueryText(queryText);
            request.setShowSystemIndices(showSystemIndices);

            IndicesResponseDTO response = monitorService.getIndices(request);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to get indices", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取索引详情
     *
     * @param indexName 索引名称
     * @param minutes   时间范围（分钟），默认60分钟
     * @return 索引详情
     */
    @GetMapping("/indices/{indexName}")
    public ResponseEntity<IndexDetailDTO> getIndexDetail(
            @PathVariable String indexName,
            @RequestParam(defaultValue = "60") Integer minutes) {
        try {
            TimeRangeRequest timeRange = buildTimeRange(minutes);
            IndexDetailDTO detail = monitorService.getIndexDetail(indexName, timeRange);
            return ResponseEntity.ok(detail);
        } catch (IOException e) {
            log.error("Failed to get index detail: {}", indexName, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取索引时序数据
     *
     * @param indexName 索引名称
     * @param minutes   时间范围（分钟），默认60分钟
     * @return 时序数据
     */
    @GetMapping("/indices/{indexName}/timeseries")
    public ResponseEntity<Map<String, List<TimeSeriesPointDTO>>> getIndexTimeSeries(
            @PathVariable String indexName,
            @RequestParam(defaultValue = "60") Integer minutes) {
        try {
            TimeRangeRequest timeRange = buildTimeRange(minutes);
            Map<String, List<TimeSeriesPointDTO>> timeSeries = monitorService.getIndexTimeSeries(indexName, timeRange);
            return ResponseEntity.ok(timeSeries);
        } catch (IOException e) {
            log.error("Failed to get index time series: {}", indexName, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 构建时间范围
     */
    private TimeRangeRequest buildTimeRange(Integer minutes) {
        TimeRangeRequest timeRange = new TimeRangeRequest();
        Instant now = Instant.now();
        timeRange.setMin(now.minus(minutes, ChronoUnit.MINUTES).toString());
        timeRange.setMax(now.toString());
        return timeRange;
    }

    /**
     * 获取 API 调用统计信息
     * 用于监控和性能分析
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getApiStats() {
        Map<String, Object> result = new HashMap<>();

        Map<String, Map<String, Object>> statsMap = new HashMap<>();
        kibanaClient.getApiStatsMap().forEach((path, stats) -> {
            Map<String, Object> statInfo = new HashMap<>();
            statInfo.put("callCount", stats.getCallCount().get());
            statInfo.put("avgTimeMs", stats.getAvgTimeMs());
            statInfo.put("minTimeMs", stats.getMinTimeMs() == Long.MAX_VALUE ? 0 : stats.getMinTimeMs());
            statInfo.put("maxTimeMs", stats.getMaxTimeMs());
            statInfo.put("lastCallTimeMs", stats.getLastCallTimeMs());
            statInfo.put("totalTimeMs", stats.getTotalTimeMs().get());
            statsMap.put(path, statInfo);
        });

        result.put("apiStats", statsMap);
        result.put("timestamp", System.currentTimeMillis());

        // 打印到日志
        kibanaClient.logApiStats();

        return ResponseEntity.ok(result);
    }
}
