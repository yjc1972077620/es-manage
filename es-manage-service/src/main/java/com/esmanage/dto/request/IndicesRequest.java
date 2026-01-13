package com.esmanage.dto.request;

import lombok.Data;

/**
 * 索引列表请求参数
 */
@Data
public class IndicesRequest {

    /** 时间范围 */
    private TimeRangeRequest timeRange;

    /** 分页 */
    private NodesRequest.PaginationRequest pagination;

    /** 搜索文本 */
    private String queryText = "";

    /** 是否显示系统索引 */
    private Boolean showSystemIndices = false;
}
