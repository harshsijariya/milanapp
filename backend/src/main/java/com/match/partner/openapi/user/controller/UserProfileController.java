package com.match.partner.openapi.user.controller;

import com.match.partner.common.Utils.CommonUtils;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.model.dto.ProfileRegistrationDto;
import com.match.partner.openapi.user.model.dto.UserDto;
import com.match.partner.openapi.user.model.dto.UserProfileDTO;
import com.match.partner.openapi.user.model.dto.BasicInfoDTO;
import com.match.partner.openapi.user.model.dto.ContactInfoDTO;
import com.match.partner.openapi.user.model.dto.EducationInfoDTO;
import com.match.partner.openapi.user.model.dto.FamilyInfoDTO;
import com.match.partner.openapi.user.model.dto.ReligionInfoDTO;
import com.match.partner.openapi.user.service.UserProfileServiceInterface;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class UserProfileController {

    @Autowired
    private UserProfileServiceInterface userProfileService;

    @Autowired
    private CommonUtils commonUtils;


    @GetMapping("/user")
    public UserProfileDTO getUser(@RequestAttribute("username") String userName){
        return  userProfileService.getUser(userName);
    }

    @GetMapping("/users")
    public Page<UserDto> getUsers(@RequestAttribute("username") String userName,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        return userProfileService.getUsers(userName, page, size);
    }

    @GetMapping("/users/{id}")
    public UserProfileDTO getUserById(@RequestAttribute("username") String userName,
                                      @PathVariable("id") String id) {
        return userProfileService.getUsers(commonUtils.convertFromJMFormat(id), userName);
    }

    @PatchMapping("/user/profile")
    public ResponseEntity<UserProfile> updateUserProfile(@RequestBody UserProfileDTO userProfileDTO,
                                                         @RequestAttribute("username") String userName) {
        userProfileService.updateUserProfile(userProfileDTO, userName);

        return null;
    }

    @PostMapping("/user/profile")
    public ResponseEntity<UserProfile> createUserProfile(@RequestBody ProfileRegistrationDto userProfileDTO,
                                                         @RequestAttribute("username") String userName) {
        userProfileService.registerProfile(userProfileDTO, userName);
        return null;
    }

    // Split GET Endpoints

    @GetMapping("/user/profile/basic")
    public BasicInfoDTO getBasicInfo(@RequestAttribute("username") String userName) {
        return userProfileService.getBasicInfo(userName);
    }

    @GetMapping("/user/profile/contact")
    public ContactInfoDTO getContactInfo(@RequestAttribute("username") String userName) {
        return userProfileService.getContactInfo(userName);
    }

    @GetMapping("/user/profile/religion")
    public ReligionInfoDTO getReligionInfo(@RequestAttribute("username") String userName) {
        return userProfileService.getReligionInfo(userName);
    }

    @GetMapping("/user/profile/education")
    public EducationInfoDTO getEducationInfo(@RequestAttribute("username") String userName) {
        return userProfileService.getEducationInfo(userName);
    }

    @GetMapping("/user/profile/family")
    public FamilyInfoDTO getFamilyInfo(@RequestAttribute("username") String userName) {
        return userProfileService.getFamilyInfo(userName);
    }

    // Split PATCH Endpoints

    @PatchMapping("/user/profile/basic")
    public ResponseEntity<Void> updateBasicInfo(@RequestBody BasicInfoDTO dto,
                                                @RequestAttribute("username") String userName) {
        userProfileService.updateBasicInfo(dto, userName);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/user/profile/contact")
    public ResponseEntity<Void> updateContactInfo(@RequestBody ContactInfoDTO dto,
                                                  @RequestAttribute("username") String userName) {
        userProfileService.updateContactInfo(dto, userName);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/user/profile/religion")
    public ResponseEntity<Void> updateReligionInfo(@RequestBody ReligionInfoDTO dto,
                                                   @RequestAttribute("username") String userName) {
        userProfileService.updateReligionInfo(dto, userName);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/user/profile/education")
    public ResponseEntity<Void> updateEducationInfo(@RequestBody EducationInfoDTO dto,
                                                    @RequestAttribute("username") String userName) {
        userProfileService.updateEducationInfo(dto, userName);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/user/profile/family")
    public ResponseEntity<Void> updateFamilyInfo(@RequestBody FamilyInfoDTO dto,
                                                 @RequestAttribute("username") String userName) {
        userProfileService.updateFamilyInfo(dto, userName);
        return ResponseEntity.ok().build();
    }
}