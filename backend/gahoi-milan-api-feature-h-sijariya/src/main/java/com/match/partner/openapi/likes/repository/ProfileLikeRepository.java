package com.match.partner.openapi.likes.repository;

import com.match.partner.openapi.likes.model.ProfileLike;
import com.match.partner.openapi.likes.model.ProfileLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProfileLikeRepository extends JpaRepository<ProfileLike, ProfileLikeId> {

    /**
     * Interests you sent, newest first.
     *
     * Ordering is baked into the query rather than sorted in the service,
     * because both call sites want the same order and only one of them
     * remembered to sort.
     */
    List<ProfileLike> findByIdLikerIdOrderByLikedAtDesc(int likerId);

    /** Interests you received, newest first. */
    List<ProfileLike> findByIdLikedProfileIdOrderByLikedAtDesc(int likedProfileId);

    boolean existsByIdLikerIdAndIdLikedProfileId(int likerId, int likedProfileId);

    void deleteByIdLikerIdAndIdLikedProfileId(int likerId, int likedProfileId);
}
