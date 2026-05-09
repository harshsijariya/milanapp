package com.match.partner.openapi.shortlist.model.dao;

import com.match.partner.openapi.user.model.dao.UserProfile;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "shortlist")
@Data
public class Shortlist {

    @EmbeddedId
    private ShortlistId id;

    @ManyToOne
    @MapsId("profileId")
    @JoinColumn(name = "profile_id", nullable = false)
    private UserProfile profile;

    @ManyToOne
    @MapsId("shortlistedId")
    @JoinColumn(name = "shortlist_id", nullable = false)
    private UserProfile shortlistedProfile;
}
