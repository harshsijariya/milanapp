package com.match.partner.openapi.user.controller;

import com.match.partner.common.configuration.ClientException;
import com.match.partner.common.service.JwtServiceInterface;
import com.match.partner.openapi.user.model.dao.Status;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.model.dto.*;
import com.match.partner.openapi.user.service.AuthenticationServiceInterface;
import lombok.RequiredArgsConstructor;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@RequestMapping("api/v1/auth")
public class UserAuthController {

    private final JwtServiceInterface jwtService;
    private final AuthenticationServiceInterface authenticationService;
    private final com.match.partner.openapi.user.service.TokenBlacklistService tokenBlacklistService;

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }


    @PostMapping("/signup")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterUserDto registerUserDto) {
        UserProfile registeredUser = authenticationService.signup(registerUserDto);
        if(registeredUser.getStatus().equals(Status.PENDING)) {
            LoginUserDto userDto = new LoginUserDto();
            userDto.setEmail(registerUserDto.getEmail());
            userDto.setPassword(registerUserDto.getPassword());
            UserProfile authenticatedUser = authenticationService.authenticate(userDto);
            String jwtToken = jwtService.generateToken(authenticatedUser);
            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setToken(jwtToken);
            loginResponse.setExpiresIn(jwtService.getExpirationTime());
            return ResponseEntity.ok(loginResponse);

        }
        else {
            throw new ClientException(HttpStatus.BAD_REQUEST,"Some");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@RequestBody LoginUserDto loginUserDto) {
        UserProfile authenticatedUser = authenticationService.authenticate(loginUserDto);
        String jwtToken = jwtService.generateToken(authenticatedUser);
        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken(jwtToken);
        loginResponse.setExpiresIn(jwtService.getExpirationTime());
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            tokenBlacklistService.blacklistToken(token);
        }
        return ResponseEntity.ok("Logged out successfully");
    }


}


