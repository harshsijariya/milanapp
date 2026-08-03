package com.match.partner.openapi.user.model.dto;

import jakarta.persistence.Entity;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserProfileDTO {
    private String name;
    private String id;
    private String maritalStatus;
    private String gender;
    private String complexion;
    private String height;
    private Integer weight;
    private String diet;
    private String disability;
    private String bloodGroup;
    private String profileCreatedBy;
    private String country;
    private String state;
    private String city;
    private String town;
    private String mobileNo;
    private String fathersContactNo;
    private String whatsappNo;
    private String email;
    private String presentAddress;
    private String permanentAddress;
    private String gotra;
    private String aakna;
    private String motherTongue;
    private LocalDateTime dateOfBirth;
    private String timeOfBirth;
    private String placeOfBirth;
    private String zodiac;
    private String fathersName;
    private String fathersOccupation;
    private String mothersName;
    private String mothersOccupation;
    private Integer marriedBrothers;
    private Integer unmarriedBrothers;
    private Integer marriedSisters;
    private Integer unmarriedSisters;
    private String maternalUnclesName;
    private String maternalUnclesAakna;
    private String houseStatus;
    private String carStatus;
    private String education;
    private String educationDetails;
    private String occupationDetails;
    private String annualIncome;

    private String nakshatra;
    private String aboutMyself;
    private String partnerPreferences;
    private String manglik;
    private String profession;
    private String status;

    private String workCity;
    private String employedIn;
    private String organization;
    private LocalDateTime occupationStartDate;
    private LocalDateTime lastActive;

    /**
     * How complete this profile is, 0-100. Read from the entity, where it is
     * recalculated on every save - the client must not try to derive it from
     * the fields below, because the weights live in profile_completion_weight
     * and change without an app release.
     */
    private Integer profileCompletion;

    private String profileImage;
    private List<String> profileImages;
    private List<ProfileImageDto> profileImageDetails;
    private Boolean isLiked;
    private String likeStatus; // PENDING / ACCEPTED / REJECTED / null
    private Boolean isShortlisted;
}