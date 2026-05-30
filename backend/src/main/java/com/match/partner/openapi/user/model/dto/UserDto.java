package com.match.partner.openapi.user.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDto {
    private String name;
    private String gender;
    private String height;
    private String id;
    private String presentAddress;
    private String permanentAddress;
    private LocalDateTime dateOfBirth;
    private String email;
    private String profession;
    private String gotra;
    private String zodiac;
    private Boolean isOnline;
    private String annualIncome;
    private String education;
    private String profileImage;
    private Boolean isLiked;
    private Boolean isShortlisted;
}
