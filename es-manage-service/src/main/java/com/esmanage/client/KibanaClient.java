package com.esmanage.client;

import com.esmanage.config.KibanaConfig;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Kibana HTTP 客户端
 * 封装与 Kibana Monitoring API 的通信
 * 
 * 优化点：
 * 1. 使用 Basic Auth 认证，无需每次登录
 * 2. 连接池复用
 * 3. 接口耗时统计
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KibanaClient {

    private final KibanaConfig kibanaConfig;
    private final ObjectMapper objectMapper;

    private OkHttpClient httpClient;

    /** 接口调用统计 */
    @Getter
    private final Map<String, ApiStats> apiStatsMap = new ConcurrentHashMap<>();

    /**
     * API 统计信息
     */
    @Getter
    public static class ApiStats {
        private final String path;
        private final AtomicLong callCount = new AtomicLong(0);
        private final AtomicLong totalTimeMs = new AtomicLong(0);
        private volatile long minTimeMs = Long.MAX_VALUE;
        private volatile long maxTimeMs = 0;
        private volatile long lastCallTimeMs = 0;

        public ApiStats(String path) {
            this.path = path;
        }

        public void record(long timeMs) {
            callCount.incrementAndGet();
            totalTimeMs.addAndGet(timeMs);
            lastCallTimeMs = timeMs;

            // 更新最小/最大值（非线程安全，但统计数据允许少量误差）
            if (timeMs < minTimeMs)
                minTimeMs = timeMs;
            if (timeMs > maxTimeMs)
                maxTimeMs = timeMs;
        }

        public long getAvgTimeMs() {
            long count = callCount.get();
            return count > 0 ? totalTimeMs.get() / count : 0;
        }

        @Override
        public String toString() {
            return String.format("API[%s]: calls=%d, avg=%dms, min=%dms, max=%dms, last=%dms",
                    path, callCount.get(), getAvgTimeMs(),
                    minTimeMs == Long.MAX_VALUE ? 0 : minTimeMs,
                    maxTimeMs, lastCallTimeMs);
        }
    }

    @PostConstruct
    public void init() {
        // 创建 HTTP 客户端，优化连接池配置
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                // 增大连接池：最多10个空闲连接，保持5分钟
                .connectionPool(new ConnectionPool(10, 5, TimeUnit.MINUTES))
                .build();

        // 配置 ObjectMapper
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        log.info("KibanaClient initialized with connection pool (10 connections, 5min keep-alive)");
    }

    /**
     * 发送 POST 请求到 Kibana Monitoring API
     * 使用 Basic Auth 认证，无需预先登录
     */
    public <T> T post(String path, Object requestBody, Class<T> responseType) throws IOException {
        String url = kibanaConfig.getBaseUrl() + path;
        String jsonBody = objectMapper.writeValueAsString(requestBody);

        // 简化路径用于统计（去除动态参数）
        String statsPath = simplifyPath(path);

        log.debug("POST {} with body: {}", url, jsonBody);

        Request request = buildRequest(url, jsonBody);

        long startTime = System.currentTimeMillis();
        try (Response response = httpClient.newCall(request).execute()) {
            long elapsed = System.currentTimeMillis() - startTime;

            // 记录统计
            recordApiStats(statsPath, elapsed);

            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                log.error("Request failed: {} {} - {} ({}ms)", response.code(), path,
                        responseBody.length() > 200 ? responseBody.substring(0, 200) : responseBody, elapsed);
                throw new IOException("Request failed: " + response.code() + " - " + responseBody);
            }

            log.debug("Response ({}ms): {}", elapsed,
                    responseBody.length() > 500 ? responseBody.substring(0, 500) + "..." : responseBody);

            return objectMapper.readValue(responseBody, responseType);
        } catch (IOException e) {
            long elapsed = System.currentTimeMillis() - startTime;
            recordApiStats(statsPath, elapsed);
            throw e;
        }
    }

    /**
     * 简化路径用于统计（将动态参数替换为占位符）
     */
    private String simplifyPath(String path) {
        // 替换 UUID 格式的节点 ID
        String simplified = path.replaceAll("/nodes/[a-zA-Z0-9_-]+", "/nodes/{nodeId}");
        // 替换索引名称
        simplified = simplified.replaceAll("/indices/[^/\\?]+", "/indices/{indexName}");
        // 移除查询参数
        int queryIndex = simplified.indexOf('?');
        if (queryIndex > 0) {
            simplified = simplified.substring(0, queryIndex);
        }
        return simplified;
    }

    /**
     * 记录 API 统计
     */
    private void recordApiStats(String path, long timeMs) {
        apiStatsMap.computeIfAbsent(path, ApiStats::new).record(timeMs);

        // 如果耗时超过 2 秒，记录警告
        if (timeMs > 2000) {
            log.warn("Slow API call: {} took {}ms", path, timeMs);
        }
    }

    /**
     * 获取所有 API 统计信息（用于监控）
     */
    public String getApiStatsReport() {
        StringBuilder sb = new StringBuilder();
        sb.append("\n========== Kibana API Statistics ==========\n");

        apiStatsMap.values().stream()
                .sorted((a, b) -> Long.compare(b.getAvgTimeMs(), a.getAvgTimeMs()))
                .forEach(stats -> sb.append(stats.toString()).append("\n"));

        sb.append("============================================\n");
        return sb.toString();
    }

    /**
     * 打印 API 统计报告到日志
     */
    public void logApiStats() {
        log.info(getApiStatsReport());
    }

    /**
     * 构建请求（使用 Basic Auth）
     */
    private Request buildRequest(String url, String jsonBody) {
        // 构建 Basic Auth
        String credentials = kibanaConfig.getUsername() + ":" + kibanaConfig.getPassword();
        String basicAuth = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        return new Request.Builder()
                .url(url)
                .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                .addHeader("Content-Type", "application/json")
                .addHeader("Authorization", basicAuth)
                .addHeader("kbn-version", kibanaConfig.getVersion())
                .addHeader("kbn-build-number", kibanaConfig.getBuildNumber())
                .addHeader("x-elastic-internal-origin", "Kibana")
                .addHeader("x-kbn-context", URLEncoder.encode(
                        "{\"type\":\"application\",\"name\":\"monitoring\",\"url\":\"/app/monitoring\"}",
                        StandardCharsets.UTF_8))
                .build();
    }

    /**
     * 获取集群 ID
     */
    public String getClusterId() {
        return kibanaConfig.getClusterId();
    }
}
