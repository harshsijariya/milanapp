package com.match.partner.openapi.user.service;

import com.match.partner.openapi.user.model.UserProfileMapper;
import com.match.partner.openapi.user.model.dao.Status;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.model.dto.ProfileRegistrationDto;
import com.match.partner.openapi.user.model.dto.UserDto;
import com.match.partner.openapi.user.model.dto.UserProfileDTO;
import com.match.partner.openapi.user.model.dto.BasicInfoDTO;
import com.match.partner.openapi.user.model.dto.ContactInfoDTO;
import com.match.partner.openapi.user.model.dto.EducationInfoDTO;
import com.match.partner.openapi.user.model.dto.FamilyInfoDTO;
import com.match.partner.openapi.user.model.dto.ReligionInfoDTO;
import com.match.partner.openapi.profile.service.ProfileCompletionCalculator;
import com.match.partner.openapi.user.repository.UserProfileRepository;
import com.match.partner.openapi.views.service.ViewsServiceInterface;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.match.partner.common.configuration.ClientException;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.match.partner.openapi.likes.model.ProfileLike;
import com.match.partner.openapi.likes.model.ProfileLikeId;
import com.match.partner.openapi.likes.repository.ProfileLikeRepository;
import com.match.partner.openapi.shortlist.repository.ShortlistRepository;
import com.match.partner.openapi.shortlist.model.dao.ShortlistId;

@Service
public class UserProfileServiceImpl implements UserProfileServiceInterface {

    @Autowired
    private UserProfileRepository userProfileRepository;
    @Autowired
    private UserProfileMapper userProfileMapper;
    @Autowired
    private ViewsServiceInterface viewsService;
    @Autowired
    private ProfileLikeRepository profileLikeRepository;
    @Autowired
    private ShortlistRepository shortlistRepository;
    /**
     * Rescores the profile before each save, inside the same transaction, so
     * the stored percentage can never disagree with the data it describes.
     */
    @Autowired
    private ProfileCompletionCalculator completionCalculator;


    public UserProfile updateUserProfile(UserProfileDTO dto, UserProfile userProfile) {
        if (dto.getName() != null) {
            userProfile.setName(dto.getName());
        }
        if (dto.getMaritalStatus() != null) {
            userProfile.setMaritalStatus(dto.getMaritalStatus());
        }
        if (dto.getGender() != null) {
            userProfile.setGender(dto.getGender());
        }
        if (dto.getComplexion() != null) {
            userProfile.setComplexion(dto.getComplexion());
        }
        if (dto.getHeight() != null) {
            userProfile.setHeight(dto.getHeight());
        }
        if (dto.getWeight() != null) {
            userProfile.setWeight(dto.getWeight());
        }
        if (dto.getDiet() != null) {
            userProfile.setDiet(dto.getDiet());
        }
        if (dto.getDisability() != null) {
            userProfile.setDisability(dto.getDisability());
        }
        if (dto.getBloodGroup() != null) {
            userProfile.setBloodGroup(dto.getBloodGroup());
        }
        if (dto.getProfileCreatedBy() != null) {
            userProfile.setProfileCreatedBy(dto.getProfileCreatedBy());
        }
        if (dto.getCountry() != null) {
            userProfile.setCountry(dto.getCountry());
        }
        if (dto.getState() != null) {
            userProfile.setState(dto.getState());
        }
        if (dto.getCity() != null) {
            userProfile.setCity(dto.getCity());
        }
        if (dto.getTown() != null) {
            userProfile.setTown(dto.getTown());
        }
        if (dto.getFathersContactNo() != null) {
            userProfile.setFathersContactNumber(dto.getFathersContactNo());
        }
        if (dto.getWhatsappNo() != null) {
            userProfile.setWhatsappNumber(dto.getWhatsappNo());
        }
        if (dto.getPresentAddress() != null) {
            userProfile.setPresentAddress(dto.getPresentAddress());
        }
        if (dto.getPermanentAddress() != null) {
            userProfile.setPermanentAddress(dto.getPermanentAddress());
        }
        if (dto.getGotra() != null) {
            userProfile.setGotra(dto.getGotra());
        }
        if (dto.getAakna() != null) {
            userProfile.setAakna(dto.getAakna());
        }
        if (dto.getMotherTongue() != null) {
            userProfile.setMotherTongue(dto.getMotherTongue());
        }
        if (dto.getDateOfBirth() != null) {
            userProfile.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getTimeOfBirth() != null) {
            userProfile.setTimeOfBirth(dto.getTimeOfBirth());
        }
        if (dto.getPlaceOfBirth() != null) {
            userProfile.setPlaceOfBirth(dto.getPlaceOfBirth());
        }
        if (dto.getZodiac() != null) {
            userProfile.setZodiac(dto.getZodiac());
        }
        if (dto.getFathersName() != null) {
            userProfile.setFathersName(dto.getFathersName());
        }
        if (dto.getFathersOccupation() != null) {
            userProfile.setFathersOccupation(dto.getFathersOccupation());
        }
        if (dto.getMothersName() != null) {
            userProfile.setMothersName(dto.getMothersName());
        }
        if (dto.getMothersOccupation() != null) {
            userProfile.setMothersOccupation(dto.getMothersOccupation());
        }
        if (dto.getMarriedBrothers() != null) {
            userProfile.setNoOfMarriedBrothers(dto.getMarriedBrothers());
        }
        if (dto.getUnmarriedBrothers() != null) {
            userProfile.setNoOfUnmarriedBrothers(dto.getUnmarriedBrothers());
        }
        if (dto.getMarriedSisters() != null) {
            userProfile.setNoOfMarriedSisters(dto.getMarriedSisters());
        }
        if (dto.getUnmarriedSisters() != null) {
            userProfile.setNoOfUnmarriedSisters(dto.getUnmarriedSisters());
        }
        if (dto.getMaternalUnclesName() != null) {
            userProfile.setMaternalUnclesName(dto.getMaternalUnclesName());
        }
        if (dto.getMaternalUnclesAakna() != null) {
            userProfile.setMaternalUnclesAakna(dto.getMaternalUnclesAakna());
        }
        if (dto.getHouseStatus() != null) {
            userProfile.setHouseStatus(dto.getHouseStatus());
        }
        if (dto.getCarStatus() != null) {
            userProfile.setCarStatus(dto.getCarStatus());
        }
        if (dto.getEducation() != null) {
            userProfile.setEducation(dto.getEducation());
        }
        if (dto.getEducationDetails() != null) {
            userProfile.setEducationDetail(dto.getEducationDetails());
        }
        if (dto.getOccupationDetails() != null) {
            userProfile.setOccupationDetail(dto.getOccupationDetails());
        }
        if (dto.getAnnualIncome() != null) {
            userProfile.setAnnualIncome(dto.getAnnualIncome());
        }
        if (dto.getProfession() != null) {
            userProfile.setProfession(dto.getProfession());
        }
        if(dto.getAboutMyself() != null){
            userProfile.setAboutMyself(dto.getAboutMyself());
        }
        if(dto.getPartnerPreferences() != null){
            userProfile.setPartnerPreferences(dto.getPartnerPreferences());
        }
        if(dto.getManglik() != null){
            userProfile.setManglik(dto.getManglik());
        }
        if(dto.getNakshatra() != null){
            userProfile.setNakshatra(dto.getNakshatra());
        }
        if(dto.getWorkCity() != null){
            userProfile.setWorkCity(dto.getWorkCity());
        }
        if(dto.getEmployedIn() != null){
            userProfile.setEmployedIn(dto.getEmployedIn());
        }
        if(dto.getOrganization() != null){
            userProfile.setOrganization(dto.getOrganization());
        }
        if(dto.getOccupationStartDate() != null){
            userProfile.setOccupationStartDate(dto.getOccupationStartDate());
        }
        if(dto.getLastActive() != null){
            userProfile.setLastActive(dto.getLastActive());
        }

        completionCalculator.apply(userProfile);
        return userProfileRepository.save(userProfile);
    }

    public UserProfile registerProfile(ProfileRegistrationDto userProfileDTO, String userName){
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User with email " + userName + " not found"));

        if(userProfileDTO.getName()!=null){
            userProfile.setName(userProfileDTO.getName());
        }
        if(userProfileDTO.getGender()!=null){
            userProfile.setGender(userProfileDTO.getGender());
        }
        if(userProfileDTO.getDateOfBirth()!=null){
            userProfile.setDateOfBirth(userProfileDTO.getDateOfBirth());
        }
        if(userProfileDTO.getCountry()!=null){
            userProfile.setCountry(userProfileDTO.getCountry());
        }
        if(userProfileDTO.getCity()!=null){
            userProfile.setCity(userProfileDTO.getCity());
        }
        if(userProfileDTO.getState()!=null){
            userProfile.setState(userProfileDTO.getState());
        }
        if(userProfileDTO.getProfileCreatedBy()!=null){
            userProfile.setProfileCreatedBy(userProfileDTO.getProfileCreatedBy());
        }
        if(userProfileDTO.getMobileNo()!=null){
            userProfile.setMobileNumber(userProfileDTO.getMobileNo());
        }
        userProfile.setStatus(Status.CREATED);
        completionCalculator.apply(userProfile);
        return userProfileRepository.save(userProfile);
    }



    public void updateUserProfile(UserProfileDTO userProfileDTO, String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User with email " + userName + " not found"));
        updateUserProfile(userProfileDTO, userProfile);

    }

    public void registerUserProfile(UserProfileDTO userProfileDTO, String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User with email " + userName + " not found"));
        updateUserProfile(userProfileDTO, userProfile);

    }


    public UserProfileDTO getUser(String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName).get();
        return  userProfileMapper.toDto(userProfile);
    }

    /**
     * The gender a member is browsing for.
     *
     * Returns null when the caller's own gender is missing or is anything other
     * than the two values this app records, and null means "do not filter". A
     * member who has not filled in their gender yet still gets a populated feed
     * rather than an empty screen they cannot explain.
     */
    private String oppositeGenderOf(String gender) {
        if (gender == null) {
            return null;
        }
        String normalised = gender.trim().toLowerCase();
        if (normalised.equals("male")) {
            return "Female";
        }
        if (normalised.equals("female")) {
            return "Male";
        }
        return null;
    }

    /**
     * Hide or unhide the caller's own profile.
     *
     * Takes the email from the JWT rather than an id in the request, so a
     * member can only ever change their own visibility - there is no id to
     * tamper with.
     */
    @Override
    public void setProfileHidden(String userName, boolean hidden) {
        UserProfile profile = requireLiveProfile(userName);
        profile.setHidden(hidden);
        userProfileRepository.save(profile);
    }

    /**
     * Soft-delete the caller's own profile.
     *
     * Deliberately not a hard DELETE. Likes, shortlists, views and
     * notifications all hold this id, so removing the row would either fail on
     * the constraints or take other members' history with it. Stamping
     * deleted_at takes the profile out of every listing and refuses the direct
     * fetch, which is what "deleted" means to everyone else.
     *
     * The account is also hidden on the way out, so that if the row is ever
     * restored it comes back invisible rather than silently reappearing in
     * everyone's feed.
     */
    @Override
    public void deleteOwnProfile(String userName) {
        UserProfile profile = requireLiveProfile(userName);
        profile.setDeletedAt(LocalDateTime.now());
        profile.setHidden(true);
        userProfileRepository.save(profile);
    }

    private UserProfile requireLiveProfile(String userName) {
        UserProfile profile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new ClientException(HttpStatus.NOT_FOUND, "Profile not found"));

        if (profile.getDeletedAt() != null) {
            throw new ClientException(HttpStatus.GONE, "This profile has already been deleted");
        }
        return profile;
    }

    public Page<UserDto> getUsers(int page, int size, String userName, boolean oppositeGender) {
        // Newest members first. Secondary sort on id because two profiles created
        // in the same second would otherwise come back in an arbitrary order,
        // which makes a paged list drop or repeat rows between pages.
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));

        Optional<UserProfile> currentUserOptional = userProfileRepository.findByEmail(userName);
        if (currentUserOptional.isEmpty()) {
            return userProfileRepository.findAll(pageable).map(userProfileMapper::toUserDto);
        }
        UserProfile currentUser = currentUserOptional.get();
        int currentUserId = currentUser.getId();

        // Never list the caller to themselves. When the caller asked for
        // matches, narrow further to the gender they are looking for.
        String lookingFor = oppositeGender ? oppositeGenderOf(currentUser.getGender()) : null;

        Page<UserProfile> userProfilesPage = lookingFor == null
                ? userProfileRepository.findByIdNot(currentUserId, pageable)
                : userProfileRepository.findByIdNotAndGender(currentUserId, lookingFor, pageable);

        return userProfilesPage.map(userProfile -> {
            UserDto userDto = userProfileMapper.toUserDto(userProfile);
            int viewedProfileId = userProfile.getId();
            
            // Look in both directions: a connection is the same relationship whether
            // we sent the interest or received and accepted it.
            Optional<ProfileLike> profileLike = profileLikeRepository
                    .findById(new ProfileLikeId(currentUserId, viewedProfileId))
                    .or(() -> profileLikeRepository.findById(new ProfileLikeId(viewedProfileId, currentUserId)));
            userDto.setIsLiked(profileLike.isPresent());
            userDto.setLikeStatus(profileLike.map(like -> like.getStatus().name()).orElse(null));

            ShortlistId shortlistId = new ShortlistId();
            shortlistId.setProfileId(currentUserId);
            shortlistId.setShortlistedId(viewedProfileId);
            boolean isShortlisted = shortlistRepository.existsById(shortlistId);
            userDto.setIsShortlisted(isShortlisted);
            
            return userDto;
        });
    }


    public UserProfileDTO getUsers(Integer id, String userName) {
        UserProfile userProfile = userProfileRepository.findById(id)
                .orElseThrow(() -> new ClientException(HttpStatus.NOT_FOUND, "Profile not found"));

        // A soft-deleted profile is gone as far as anyone else is concerned.
        // Filtering it out of the listings alone would not be enough: ids are
        // sequential and a deep link or an old notification still carries one,
        // so the direct fetch has to refuse too.
        //
        // Hidden profiles are deliberately still reachable by id. Someone who
        // has already connected, or who is looking at their own like history,
        // should not have the other person vanish - hiding is about not being
        // discovered in browse, not about cutting existing ties.
        if (userProfile.getDeletedAt() != null) {
            throw new ClientException(HttpStatus.NOT_FOUND, "This profile is no longer available");
        }
        Optional<UserProfile>  userProfileOptional = userProfileRepository.findByEmail(userName);
        int profileId = userProfileOptional.get().getId();
        viewsService.addView(id,profileId);
        
        UserProfileDTO dto = userProfileMapper.toDto(userProfile);
        // Both directions - see getUsers(page,size,userName) above.
        Optional<ProfileLike> profileLike = profileLikeRepository
                .findById(new ProfileLikeId(profileId, id))
                .or(() -> profileLikeRepository.findById(new ProfileLikeId(id, profileId)));
        dto.setIsLiked(profileLike.isPresent());
        dto.setLikeStatus(profileLike.map(like -> like.getStatus().name()).orElse(null));

        ShortlistId shortlistId = new ShortlistId();
        shortlistId.setProfileId(profileId);
        shortlistId.setShortlistedId(id);
        dto.setIsShortlisted(shortlistRepository.existsById(shortlistId));
        
        return dto;
    }

    @Override
    public BasicInfoDTO getBasicInfo(String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileMapper.toBasicInfoDto(userProfile);
    }

    @Override
    public void updateBasicInfo(BasicInfoDTO dto, String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (dto.getName() != null) userProfile.setName(dto.getName());
        if (dto.getProfileCreatedBy() != null) userProfile.setProfileCreatedBy(dto.getProfileCreatedBy());
        if (dto.getGender() != null) userProfile.setGender(dto.getGender());
        if (dto.getMaritalStatus() != null) userProfile.setMaritalStatus(dto.getMaritalStatus());
        if (dto.getDateOfBirth() != null) userProfile.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getHeight() != null) userProfile.setHeight(dto.getHeight());
        if (dto.getWeight() != null) userProfile.setWeight(dto.getWeight());
        if (dto.getComplexion() != null) userProfile.setComplexion(dto.getComplexion());
        if (dto.getBloodGroup() != null) userProfile.setBloodGroup(dto.getBloodGroup());
        if (dto.getDiet() != null) userProfile.setDiet(dto.getDiet());
        if (dto.getDisability() != null) userProfile.setDisability(dto.getDisability());
        completionCalculator.apply(userProfile);
        userProfileRepository.save(userProfile);
    }

    @Override
    public ContactInfoDTO getContactInfo(String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileMapper.toContactInfoDto(userProfile);
    }

    @Override
    public void updateContactInfo(ContactInfoDTO dto, String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (dto.getMobileNo() != null) userProfile.setMobileNumber(dto.getMobileNo());
        if (dto.getWhatsappNo() != null) userProfile.setWhatsappNumber(dto.getWhatsappNo());
        if (dto.getCity() != null) userProfile.setCity(dto.getCity());
        if (dto.getState() != null) userProfile.setState(dto.getState());
        if (dto.getCountry() != null) userProfile.setCountry(dto.getCountry());
        if (dto.getPresentAddress() != null) userProfile.setPresentAddress(dto.getPresentAddress());
        if (dto.getPermanentAddress() != null) userProfile.setPermanentAddress(dto.getPermanentAddress());
        completionCalculator.apply(userProfile);
        userProfileRepository.save(userProfile);
    }

    @Override
    public ReligionInfoDTO getReligionInfo(String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileMapper.toReligionInfoDto(userProfile);
    }

    @Override
    public void updateReligionInfo(ReligionInfoDTO dto, String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (dto.getGotra() != null) userProfile.setGotra(dto.getGotra());
        if (dto.getAakna() != null) userProfile.setAakna(dto.getAakna());
        if (dto.getMotherTongue() != null) userProfile.setMotherTongue(dto.getMotherTongue());
        if (dto.getTimeOfBirth() != null) userProfile.setTimeOfBirth(dto.getTimeOfBirth());
        if (dto.getPlaceOfBirth() != null) userProfile.setPlaceOfBirth(dto.getPlaceOfBirth());
        if (dto.getZodiac() != null) userProfile.setZodiac(dto.getZodiac());
        if (dto.getManglik() != null) userProfile.setManglik(dto.getManglik());
        if (dto.getNakshatra() != null) userProfile.setNakshatra(dto.getNakshatra());
        completionCalculator.apply(userProfile);
        userProfileRepository.save(userProfile);
    }

    @Override
    public EducationInfoDTO getEducationInfo(String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileMapper.toEducationInfoDto(userProfile);
    }

    @Override
    public void updateEducationInfo(EducationInfoDTO dto, String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (dto.getEducation() != null) userProfile.setEducation(dto.getEducation());
        if (dto.getEducationDetails() != null) userProfile.setEducationDetail(dto.getEducationDetails());
        if (dto.getProfession() != null) userProfile.setProfession(dto.getProfession());
        if (dto.getOccupationDetails() != null) userProfile.setOccupationDetail(dto.getOccupationDetails());
        if (dto.getEmployedIn() != null) userProfile.setEmployedIn(dto.getEmployedIn());
        if (dto.getOrganization() != null) userProfile.setOrganization(dto.getOrganization());
        if (dto.getWorkCity() != null) userProfile.setWorkCity(dto.getWorkCity());
        if (dto.getAnnualIncome() != null) userProfile.setAnnualIncome(dto.getAnnualIncome());
        if (dto.getOccupationStartDate() != null) userProfile.setOccupationStartDate(dto.getOccupationStartDate());
        completionCalculator.apply(userProfile);
        userProfileRepository.save(userProfile);
    }

    @Override
    public FamilyInfoDTO getFamilyInfo(String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileMapper.toFamilyInfoDto(userProfile);
    }

    @Override
    public void updateFamilyInfo(FamilyInfoDTO dto, String userName) {
        UserProfile userProfile = userProfileRepository.findByEmail(userName)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (dto.getFathersName() != null) userProfile.setFathersName(dto.getFathersName());
        if (dto.getFathersOccupation() != null) userProfile.setFathersOccupation(dto.getFathersOccupation());
        if (dto.getFathersContactNo() != null) userProfile.setFathersContactNumber(dto.getFathersContactNo());
        if (dto.getMothersName() != null) userProfile.setMothersName(dto.getMothersName());
        if (dto.getMothersOccupation() != null) userProfile.setMothersOccupation(dto.getMothersOccupation());
        if (dto.getMarriedBrothers() != null) userProfile.setNoOfMarriedBrothers(dto.getMarriedBrothers());
        if (dto.getUnmarriedBrothers() != null) userProfile.setNoOfUnmarriedBrothers(dto.getUnmarriedBrothers());
        if (dto.getMarriedSisters() != null) userProfile.setNoOfMarriedSisters(dto.getMarriedSisters());
        if (dto.getUnmarriedSisters() != null) userProfile.setNoOfUnmarriedSisters(dto.getUnmarriedSisters());
        if (dto.getMaternalUnclesName() != null) userProfile.setMaternalUnclesName(dto.getMaternalUnclesName());
        if (dto.getMaternalUnclesAakna() != null) userProfile.setMaternalUnclesAakna(dto.getMaternalUnclesAakna());
        if (dto.getHouseStatus() != null) userProfile.setHouseStatus(dto.getHouseStatus());
        if (dto.getCarStatus() != null) userProfile.setCarStatus(dto.getCarStatus());
        if (dto.getPartnerPreferences() != null) userProfile.setPartnerPreferences(dto.getPartnerPreferences());
        if (dto.getAboutMyself() != null) userProfile.setAboutMyself(dto.getAboutMyself());
        completionCalculator.apply(userProfile);
        userProfileRepository.save(userProfile);
    }
}