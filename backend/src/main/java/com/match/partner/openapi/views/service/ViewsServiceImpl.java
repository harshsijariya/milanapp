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
import com.match.partner.openapi.likes.repository.ProfileLikeRepository;
import com.match.partner.openapi.shortlist.repository.ShortlistRepository;
import com.match.partner.openapi.shortlist.model.dao.ShortlistId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

        Views views = new Views();
        ViewsId id = new ViewsId();
        id.setProfileId(profileId);
        id.setViewedBy(viewedById);

        views.setId(id);
        views.setViewedBy(viewedBy);
        views.setViewedAt(LocalDateTime.now());

        viewsRepository.save(views);
    }

    public void addView(int profileId, String userName) {
        UserProfile viewedBy = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found: " + userName));

        Views views = new Views();
        ViewsId id = new ViewsId();
        id.setProfileId(profileId);
        id.setViewedBy(viewedBy.getId());

        views.setId(id);
        views.setViewedBy(viewedBy);
        views.setViewedAt(LocalDateTime.now());

        viewsRepository.save(views);
    }

    public Page<ViewsDto> getViews(String userName, int page, int size) {
        Optional<UserProfile> userProfileOptional = userProfileRepository.findByEmail(userName);
        UserProfile currentUser = userProfileOptional.get();
        int profileId = currentUser.getId();
        Pageable pageable = PageRequest.of(page, size);
        return viewsRepository.findByIdProfileIdOrderByViewedAtDesc(profileId, pageable)
                .map(views -> convertToDto(views, currentUser.getId()));
    }


    private ViewsDto convertToDto(Views views, int currentUserId) {
        ViewsDto dto = new ViewsDto();
        UserDto viewedProfileDto = userMapper.toUserDto(views.getViewedBy());
        
        viewedProfileDto.setIsLiked(profileLikeRepository.existsByIdLikerIdAndIdLikedProfileId(currentUserId, views.getViewedBy().getId()));
        
        ShortlistId shortlistId = new ShortlistId();
        shortlistId.setProfileId(currentUserId);
        shortlistId.setShortlistedId(views.getViewedBy().getId());
        viewedProfileDto.setIsShortlisted(shortlistRepository.existsById(shortlistId));

        dto.setViewedBy(viewedProfileDto);
        dto.setViewedAt(views.getViewedAt());

        return dto;
    }
}
