package com.esmanage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Kibana 配置类
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "kibana")
public class KibanaConfig {

    /** Kibana 服务地址 */
    private String baseUrl;

    /** 集群 ID */
    private String clusterId;

    /** 用户名 */
    private String username;

    /** 密码 */
    private String password;

    /** Kibana 版本 */
    private String version;

    /** Kibana 构建号 */
    private String buildNumber;
}
