package com.match.partner.openapi.user.model.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BasicInfoDTO {
    private String name;
    private String profileCreatedBy;
    private String gender;
    private String maritalStatus;
    private LocalDateTime dateOfBirth;
    private String height;
    private Integer weight;
    private String complexion;
    private String bloodGroup;
    private String diet;
    private String disability;
}
