package com.match.partner.common.service;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

public interface JwtServiceInterface {
    String extractUsername(String token);
    String generateToken(UserDetails userDetails);
    String generateToken(Map<String, Object> extraClaims, UserDetails userDetails);
    long getExpirationTime();
    boolean isTokenValid(String token, UserDetails userDetails);
}