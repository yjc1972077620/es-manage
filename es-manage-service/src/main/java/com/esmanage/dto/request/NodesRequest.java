package com.esmanage.dto.request;

import lombok.Data;

/**
 * 节点列表请求参数
 */
@Data
public class NodesRequest {

    /** 时间范围 */
    private TimeRangeRequest timeRange;

    /** 分页 */
    private PaginationRequest pagination;

    /**
     * 分页参数
     */
    @Data
    public static class PaginationRequest {
        /** 页码索引（从0开始） */
        private Integer index = 0;
        /** 每页大小 */
        private Integer size = 20;
    }
}
