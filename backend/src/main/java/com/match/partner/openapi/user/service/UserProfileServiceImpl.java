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
import com.match.partner.openapi.user.repository.UserProfileRepository;
import com.match.partner.openapi.views.service.ViewsServiceInterface;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserProfileServiceImpl implements UserProfileServiceInterface {

    @Autowired
    private UserProfileRepository userProfileRepository;
    @Autowired
    private UserProfileMapper userProfileMapper;
    @Autowired
    private ViewsServiceInterface viewsService;


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

    public Page<UserDto> getUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserProfile> userProfilesPage = userProfileRepository.findAll(pageable);

        // Map the Page of UserProfile to a Page of UserDto
        return userProfilesPage.map(userProfileMapper::toUserDto);
    }


    public UserProfileDTO getUsers(Integer id, String userName) {
        UserProfile userProfile = userProfileRepository.findById(id).get();
        Optional<UserProfile>  userProfileOptional = userProfileRepository.findByEmail(userName);
        int profileId = userProfileOptional.get().getId();
        viewsService.addView(id,profileId);
        return  userProfileMapper.toDto(userProfile);
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
        userProfileRepository.save(userProfile);
    }
}