package com.match.partner.openapi.likes.service;

import com.match.partner.openapi.likes.model.LikedDto;
import com.match.partner.openapi.likes.model.ProfileLike;
import com.match.partner.openapi.likes.model.ProfileLikeId;
import com.match.partner.openapi.likes.model.Status;
import com.match.partner.openapi.likes.repository.ProfileLikeRepository;
import com.match.partner.openapi.user.model.UserProfileMapper;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.model.dto.UserDto;
import com.match.partner.openapi.user.repository.UserProfileRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileLikeServiceImpl implements ProfileLikeServiceInterface {


    private final ProfileLikeRepository profileLikeRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userMapper;


    public String likeProfile(String userName, int likedId) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(userName);
        int userId = userProfileOptional.get().getId();
        if (profileLikeRepository.existsByIdLikerIdAndIdLikedProfileId(userId, likedId)) {
            return "You have already liked this profile.";
        }
        UserProfile userProfile = userProfileRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("Liker not found"));
        UserProfile likedUserProfile = userProfileRepository.findById(likedId).orElseThrow(() -> new EntityNotFoundException("Liked profile not found"));
        ProfileLike profileLike = new ProfileLike();
        profileLike.setId(new ProfileLikeId(userId, likedId));
        profileLike.setLikedAt(LocalDateTime.now());
        profileLike.setStatus(Status.PENDING);
        profileLike.setLikedProfile(likedUserProfile);
        profileLike.setLiker(userProfile);
        profileLikeRepository.save(profileLike);
        return "Profile liked successfully.";
    }

    public List<LikedDto> getAllLikes(String userName) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(userName);
        int userId = userProfileOptional.get().getId();
        return profileLikeRepository.findByIdLikedProfileId(userId).stream().map(this::convertToDto)
                .collect(Collectors.toList());
    }

//    private UserDto convertToDto(ProfileLike shortlist) {
//        UserDto shortlistedProfileDto = userMapper.toUserDto(shortlist.getLikedProfile());
//        return shortlistedProfileDto;
//    }

    private LikedDto convertToDto2(ProfileLike likedProfile){
        LikedDto likedDto = new LikedDto();
        UserDto shortlistedProfileDto = userMapper.toUserDto(likedProfile.getLikedProfile());
        likedDto.setLikedProfile(shortlistedProfileDto);
        likedDto.setStatus(likedProfile.getStatus().getValue());
        likedDto.setLikedAt(likedProfile.getLikedAt());
        return likedDto;
    }
    private LikedDto convertToDto(ProfileLike likedProfile){
        LikedDto likedDto = new LikedDto();
        UserDto shortlistedProfileDto = userMapper.toUserDto(likedProfile.getLiker());
        likedDto.setLikedProfile(shortlistedProfileDto);
        likedDto.setStatus(likedProfile.getStatus().getValue());
        likedDto.setLikedAt(likedProfile.getLikedAt());
        return likedDto;
    }

    public String acceptLike(String acceptedBy, int acceptedId) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(acceptedBy);
        int userId = userProfileOptional.get().getId();
        if (!profileLikeRepository.existsByIdLikerIdAndIdLikedProfileId(acceptedId, userId)) {
            return "Like not found.";
        }
        ProfileLikeId likedId = new ProfileLikeId(acceptedId, userId);
        Optional<ProfileLike> profileLikeOptional = profileLikeRepository.findById(likedId);
        ProfileLike profileLike = profileLikeOptional.get();
        profileLike.setStatus(Status.ACCEPTED);
        profileLikeRepository.save(profileLike);
        return "Like accepted.";
    }

    public String rejectLike(String rejectedBy, int rejectId) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(rejectedBy);
        int userId = userProfileOptional.get().getId();
        if (!profileLikeRepository.existsByIdLikerIdAndIdLikedProfileId(rejectId, userId)) {
            return "Like not found.";
        }
        ProfileLikeId rejectKey = new ProfileLikeId(rejectId, userId);
        Optional<ProfileLike> profileLikeOptional = profileLikeRepository.findById(rejectKey);
        ProfileLike profileLike = profileLikeOptional.get();
        profileLike.setStatus(Status.REJECTED);
        profileLikeRepository.save(profileLike);
        return "Like rejected.";
    }

    public List<LikedDto> getMyLikesStatus(String userName) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(userName);
        int userId = userProfileOptional.get().getId();
        return profileLikeRepository.findByIdLikerId(userId).stream().map(this::convertToDto2)
                .collect(Collectors.toList());
    }


    public void removeLike(String userName, int likedId) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(userName);
        int userId = userProfileOptional.get().getId();
//        if (profileLikeRepository.existsByIdLikerIdAndIdLikedProfileId(userId, likedId)) {
//            return "You have already liked this profile.";
//        }
        profileLikeRepository.deleteById(new ProfileLikeId(userId, likedId));
    }
}
