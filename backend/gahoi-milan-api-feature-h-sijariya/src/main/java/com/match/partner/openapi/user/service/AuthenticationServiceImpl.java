package com.match.partner.openapi.user.service;

import com.match.partner.openapi.user.model.dao.Status;
import com.match.partner.openapi.user.model.dao.UserProfile;
import com.match.partner.openapi.user.model.dto.LoginUserDto;
import com.match.partner.openapi.user.model.dto.RegisterUserDto;
import com.match.partner.openapi.user.repository.UserProfileRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthenticationServiceImpl implements AuthenticationServiceInterface {
    private final UserProfileRepository userRepository;
    
    private final PasswordEncoder passwordEncoder;
    
    private final AuthenticationManager authenticationManager;

    public AuthenticationServiceImpl(
        UserProfileRepository userRepository,
        AuthenticationManager authenticationManager,
        PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfile signup(RegisterUserDto input) {
        if (input.getPassword() == null || input.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        UserProfile user = new UserProfile();
        user.setName(input.getName());
        user.setEmail(input.getEmail());
        user.setMobileNumber(input.getMobileNo());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        user.setStatus(Status.PENDING);

        return userRepository.save(user);
    }

    public UserProfile authenticate(LoginUserDto input) {
        return userRepository.findByEmail(input.getEmail())
                .map(user -> {
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(input.getEmail(), input.getPassword())
                    );
                    return user; // Return the already retrieved user
                })
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserProfile getProfileDetails(String email) {
        Optional<UserProfile> userProfileOptional = userRepository.findByEmail(email);
        if(userProfileOptional.isPresent()){
            return userProfileOptional.get();
        }
        else{
            UserProfile userProfile = new UserProfile();
            userProfile.setEmail(email);
            userProfile.setStatus(Status.PENDING);
            userRepository.save(userProfile);
            return userProfile;
        }
    }
}