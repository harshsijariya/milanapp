package com.match.partner.openapi.user.repository;

import com.match.partner.openapi.user.model.dao.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    /**
     * Visible means: not the caller, not soft-deleted, not self-hidden.
     *
     * Written as an explicit query rather than
     * findByIdNotAndDeletedAtIsNullAndHiddenFalse so that the visibility rule
     * lives in one readable place - it has to match {@link #findByIdNotAndGender}
     * exactly, and two derived method names drifting apart is how a deleted
     * profile ends up visible on one screen and not another.
     */
    @Query("""
            SELECT u FROM UserProfile u
            WHERE u.id <> :currentUserId
              AND u.deletedAt IS NULL
              AND u.hidden = false
            """)
    Page<UserProfile> findByIdNot(@Param("currentUserId") Integer currentUserId, Pageable pageable);

    /**
     * Every profile except the caller's own, restricted to one gender.
     *
     * Backs the browse feed, where a man should be shown women and vice versa.
     * "See all profiles" deliberately does not use this - that list is meant to
     * be everyone, so it keeps calling {@link #findByIdNot}.
     *
     * Two deliberate looseness decisions, both about missing data:
     *
     *  - Profiles with no gender recorded are INCLUDED. Most rows in this
     *    database have a null gender, and filtering them out strictly turned a
     *    65-profile feed into a handful - which reads as a broken app, not as a
     *    filter working. Better to show a profile that might not match than to
     *    show an empty feed. Once gender is backfilled and made required at
     *    signup, the `IS NULL` arm here should come out.
     *  - The comparison is case-insensitive and trimmed, because the column is
     *    free text: it holds 'Male', 'Female', and at least one empty string.
     */
    @Query("""
            SELECT u FROM UserProfile u
            WHERE u.id <> :currentUserId
              AND u.deletedAt IS NULL
              AND u.hidden = false
              AND (LOWER(TRIM(u.gender)) = LOWER(:gender)
                   OR u.gender IS NULL
                   OR TRIM(u.gender) = '')
            """)
    Page<UserProfile> findByIdNotAndGender(@Param("currentUserId") Integer currentUserId,
                                           @Param("gender") String gender,
                                           Pageable pageable);
}
