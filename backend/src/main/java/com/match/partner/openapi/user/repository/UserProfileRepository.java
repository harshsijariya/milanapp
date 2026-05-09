package com.match.partner.openapi.user.repository;

import com.match.partner.openapi.user.model.dao.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
    Optional<UserProfile> findByEmail(String username);
}