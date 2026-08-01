package com.match.partner.openapi.user.model.dao;

import com.match.partner.common.Utils.NameFormatter;
import com.match.partner.common.Utils.TimeFormatter;
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

    /**
     * Signup time, used to order every listing newest-first.
     *
     * Set once on insert and never touched again - @PreUpdate must leave it
     * alone, or editing a profile would jump it back to the top of the feed.
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
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

    /**
     * 0-100, maintained by ProfileCompletionCalculator.
     *
     * Stored rather than derived: it appears on the profile header and in
     * listings, so recomputing it per request would mean reading every column
     * of every profile just to render a percentage.
     */
    @Column(name = "profile_completion", nullable = false)
    private Integer profileCompletion = 0;

    @Column(name = "profile_completion_updated_at")
    private LocalDateTime profileCompletionUpdatedAt;
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


    /**
     * Last line of defence before the row is written.
     *
     * Name casing and time-of-birth format could both be handled in the service
     * layer, but every patch method would need to remember - and the one that
     * forgot would write a name in caps or a time the TIME column rejects. A
     * lifecycle callback cannot be skipped.
     *
     * Runs on update; onInsert() calls it for the insert path, because JPA
     * permits only one callback method per lifecycle event per entity.
     */
    @PreUpdate
    private void normalise() {
        this.name = NameFormatter.toDisplayName(this.name);
        this.timeOfBirth = TimeFormatter.toDbTime(this.timeOfBirth);
    }

    /**
     * Signup stamp.
     *
     * Deliberately not on @PreUpdate: created_at is also marked
     * updatable = false, so editing a profile cannot bump it and jump the
     * profile back to the top of the feed.
     */
    @PrePersist
    private void onInsert() {
        normalise();
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
