package com.match.partner.openapi.user.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProfileRegistrationDto {

    private String gender;
    private String profileCreatedBy;
    private String name;
    private String mobileNo;
    private LocalDateTime dateOfBirth;
    private String aakna;
    private String country;
    private String state;
    private String city;

}
