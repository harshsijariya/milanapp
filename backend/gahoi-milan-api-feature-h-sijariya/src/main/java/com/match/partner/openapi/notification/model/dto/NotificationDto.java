package com.match.partner.openapi.notification.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Long id;
    private String type;
    private String title;
    private String body;
    /** JM-format code of the profile this is about, when there is one. */
    private String actorId;
    private boolean read;
    private LocalDateTime createdAt;
}
