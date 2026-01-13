package com.esmanage.dto;

import lombok.Data;
import java.util.List;

/**
 * 节点列表响应 DTO
 * 对应 Kibana API: /api/monitoring/v1/clusters/{clusterId}/elasticsearch/nodes
 */
@Data
public class NodesResponseDTO {

    /** 集群状态 */
    private ClusterStatusDTO clusterStatus;

    /** 节点列表 */
    private List<NodeInfoDTO> nodes;

    /** 节点总数 */
    private Integer totalNodeCount;
}
