package com.match.partner.common.interceptor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private JwtRequestInterceptor jwtRequestInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtRequestInterceptor)
                .addPathPatterns("/**") // Apply to all routes
                .excludePathPatterns("/api/v1/auth/**"); // Exclude authentication routes
    }
}
