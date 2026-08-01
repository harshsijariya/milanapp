package com.match.partner.openapi.user.service;

import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.model.dto.LoginUserDto;
import com.match.partner.openapi.user.model.dto.RegisterUserDto;

public interface AuthenticationServiceInterface {
    UserProfile signup(RegisterUserDto input);
    UserProfile authenticate(LoginUserDto input);
    UserProfile getProfileDetails(String email);
}