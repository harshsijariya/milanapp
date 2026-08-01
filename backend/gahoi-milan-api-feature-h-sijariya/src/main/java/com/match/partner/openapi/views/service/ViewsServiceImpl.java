package com.match.partner.openapi.views.service;

import com.match.partner.openapi.shortlist.model.dto.UserMapper;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.model.dto.UserDto;
import com.match.partner.openapi.user.repository.UserProfileRepository;
import com.match.partner.openapi.views.model.dao.Views;
import com.match.partner.openapi.views.model.dao.ViewsId;
import com.match.partner.openapi.views.model.dto.ViewsDto;
import com.match.partner.openapi.views.model.dto.ViewsRequest;
import com.match.partner.openapi.views.repository.ViewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.match.partner.openapi.likes.model.ProfileLike;
import com.match.partner.openapi.likes.model.ProfileLikeId;
import com.match.partner.openapi.likes.repository.ProfileLikeRepository;
import com.match.partner.openapi.shortlist.repository.ShortlistRepository;
import com.match.partner.openapi.shortlist.model.dao.ShortlistId;

@Service
@RequiredArgsConstructor
public class ViewsServiceImpl implements ViewsServiceInterface {
    private final ViewsRepository viewsRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserMapper userMapper;
    private final ProfileLikeRepository profileLikeRepository;
    private final ShortlistRepository shortlistRepository;


    public void addView(ViewsRequest request) {
        Views views = new Views();
        ViewsId id = new ViewsId();
        id.setProfileId(request.getProfileId());
        id.setViewedBy(request.getViewedBy());
        views.setId(id);
        views.setViewedAt(LocalDateTime.now());

        viewsRepository.save(views);
    }


    public void addView(int profileId, int viewedById) {
        UserProfile viewedBy = userProfileRepository.findById(viewedById)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + viewedById));
        upsertView(profileId, viewedBy);
    }

    public void addView(int profileId, String userName) {
        UserProfile viewedBy = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found: " + userName));
        upsertView(profileId, viewedBy);
    }

    /**
     * (profile_id, viewed_by) is the composite primary key of `views`, so viewing
     * the same profile a second time cannot insert another row. Refresh the
     * timestamp on an existing row instead of inserting a duplicate - otherwise
     * every repeat visit fails with "Duplicate entry ... for key views.PRIMARY".
     * Self-views are not recorded at all.
     */
    private void upsertView(int profileId, UserProfile viewer) {
        if (viewer.getId() == profileId) {
            return; // don't log viewing your own profile
        }

        ViewsId id = new ViewsId();
        id.setProfileId(profileId);
        id.setViewedBy(viewer.getId());

        Views views = viewsRepository.findById(id).orElseGet(() -> {
            Views fresh = new Views();
            fresh.setId(id);
            fresh.setViewedBy(viewer);
            return fresh;
        });
        views.setViewedAt(LocalDateTime.now());

        viewsRepository.save(views);
    }

    public List<ViewsDto> getViews(String userName) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(userName);
        int profileId = userProfileOptional.get().getId();
        return viewsRepository.findByIdProfileIdOrderByViewedAtDesc(profileId).stream()
                .map(views -> convertToDto(views, profileId))
                .collect(Collectors.toList());
    }


    private ViewsDto convertToDto(Views views, int viewerId) {
        ViewsDto dto = new ViewsDto();
        UserDto viewedProfileDto = userMapper.toUserDto(views.getViewedBy());
        
        int viewedProfileId = views.getViewedBy().getId();
        Optional<ProfileLike> profileLike = profileLikeRepository.findById(new ProfileLikeId(viewerId, viewedProfileId));
        viewedProfileDto.setIsLiked(profileLike.isPresent());
        viewedProfileDto.setLikeStatus(profileLike.map(like -> like.getStatus().name()).orElse(null));

        ShortlistId shortlistId = new ShortlistId();
        shortlistId.setProfileId(viewerId);
        shortlistId.setShortlistedId(viewedProfileId);
        boolean isShortlisted = shortlistRepository.existsById(shortlistId);
        viewedProfileDto.setIsShortlisted(isShortlisted);
        
        dto.setViewedBy(viewedProfileDto);
        dto.setViewedAt(views.getViewedAt());

        return dto;
    }
}
