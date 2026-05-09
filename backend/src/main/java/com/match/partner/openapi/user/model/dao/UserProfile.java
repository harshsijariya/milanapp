package com.match.partner.openapi.user.model.dao;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;

@Entity
@Table(name = "UserProfile")
@Data
public class UserProfile implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
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
    private String mobileNumber;
    private String fathersContactNumber;
    private String whatsappNumber;
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
    private Integer noOfMarriedBrothers;
    private Integer noOfUnmarriedBrothers;
    private Integer noOfMarriedSisters;
    private Integer noOfUnmarriedSisters;
    private String maternalUnclesName;
    private String maternalUnclesAakna;
    private String houseStatus;
    private String carStatus;
    private String education;
    private String educationDetail;
    private String occupationDetail;
    private String annualIncome;
    private String password;
    private String profession;
    private String nakshatra;
    private String aboutMyself;
    private String partnerPreferences;
    private String manglik;
    private String workCity;
    private String employedIn;
    private String organization;
    private LocalDateTime occupationStartDate;
    private LocalDateTime lastActive;
    @Enumerated(EnumType.STRING) // Ensure the enum is stored as a String
    @Column(name = "status", nullable = false)
    private Status status;



    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return new ArrayList<>();
    }

    @Override
    public String getUsername() {
        return email;
    }

    public String getPassword() {
        return password;
    }

}