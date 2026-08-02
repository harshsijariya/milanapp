package com.match.partner.common.interceptor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private JwtRequestInterceptor jwtRequestInterceptor;

    /**
     * The exclusions here must mirror the permitAll list in
     * SecurityConfiguration. They are two independent gates on the same
     * requests, and when they disagree the stricter one silently wins - which
     * is how /api/v1/reference came to return 401 while Spring Security was
     * happily permitting it. A path made public in one place and not the other
     * is not public.
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtRequestInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/api/v1/auth/**",
                        // Dropdown data: no user content, and the signup form
                        // needs it before a token exists.
                        "/api/v1/reference/**",
                        // Liveness probe for the deploy and uptime monitoring.
                        "/actuator/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/webjars/**"
                );
    }
}
