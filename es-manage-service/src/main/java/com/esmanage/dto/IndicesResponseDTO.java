package com.esmanage.dto;

import lombok.Data;
import java.util.List;

/**
 * 索引列表响应 DTO
 * 对应 Kibana API: /api/monitoring/v1/clusters/{clusterId}/elasticsearch/indices
 */
@Data
public class IndicesResponseDTO {

    /** 集群状态 */
    private ClusterStatusDTO clusterStatus;

    /** 索引列表 */
    private List<IndexInfoDTO> indices;
}
