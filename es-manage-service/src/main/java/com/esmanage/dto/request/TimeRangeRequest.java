package com.esmanage.dto.request;

import lombok.Data;

/**
 * 时间范围请求参数
 */
@Data
public class TimeRangeRequest {

    /** 开始时间（ISO 8601 格式或时间戳） */
    private String min;

    /** 结束时间（ISO 8601 格式或时间戳） */
    private String max;
}
