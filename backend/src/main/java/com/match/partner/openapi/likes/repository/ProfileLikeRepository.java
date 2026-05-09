package com.match.partner.openapi.likes.repository;

import com.match.partner.openapi.likes.model.ProfileLike;
import com.match.partner.openapi.likes.model.ProfileLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProfileLikeRepository extends JpaRepository<ProfileLike, ProfileLikeId> {

    List<ProfileLike> findByIdLikerId(int likerId);

    List<ProfileLike> findByIdLikedProfileId(int likedProfileId);

    boolean existsByIdLikerIdAndIdLikedProfileId(int likerId, int likedProfileId);

    void deleteByIdLikerIdAndIdLikedProfileId(int likerId, int likedProfileId);
}
