package com.match.partner.openapi.shortlist.repository;

import com.match.partner.openapi.shortlist.model.dao.Shortlist;
import com.match.partner.openapi.shortlist.model.dao.ShortlistId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShortlistRepository extends JpaRepository<Shortlist, ShortlistId> {
    List<Shortlist> findByProfileId(Integer profileId);
}
