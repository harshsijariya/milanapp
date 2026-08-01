package com.match.partner.openapi.user.repository;

import com.match.partner.openapi.user.model.dao.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {

    Optional<UserProfile> findByEmail(String username);

    /**
     * Every profile except the caller's own.
     *
     * The listing used plain findAll, so you appeared in your own browse feed,
     * with a Connect button pointing at yourself. Excluding the row in the query
     * rather than after the fetch also keeps the page size honest: dropping your
     * own row from an already-fetched page of 10 quietly returns 9.
     *
     * Sort order stays in the Pageable so the caller still controls it.
     */
    Page<UserProfile> findByIdNot(Integer id, Pageable pageable);
}
