package com.springboot.MyTodoList.security;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class WebSecurityConfiguration {

    private static final String JWK_JSON = "{\"keys\":[{\"kty\":\"RSA\",\"e\":\"AQAB\",\"kid\":\"SIGNING_KEY\",\"alg\":\"RS256\",\"n\":\"1KZENSHWhmkEV3gJm2gjTPJ12buVYKxu47mS3QC8nUD0FxsqTI-7DGaVp6P5_9cxtbJY3D5VMt_jvrydaaMw9jm1TQFu4eQW3e0752O7Ju8ovvrATo3U0rAXTrD-JMXQp_Z8zl60BZkY_M6H0ZVE9k_xDkwXN_b4vSASrRE7B8N4iVVLATUw-Np7PSVHjMJBIgz5e4ueazM6hu5BiOb8FRqwmCQoAlTM_dG9vQ1oDflJmG8ICSvKa3xlPJJBvvYFrYoQAnXu2D9kc3m6PFdi4ncKifUyhaJlL2uX7dqW3jg4rMiTLp2EdNusvqSsDZGrHZeMQ16VKSfa_3c9pH8GlQ\"}]}";

    @Bean
    public JwtDecoder jwtDecoder() {
        try {
            JWKSet jwkSet = JWKSet.parse(JWK_JSON);
            RSAKey rsaKey = (RSAKey) jwkSet.getKeys().get(0);
            return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to configure JWT decoder", e);
        }
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/", "/index.html", "/manifest.json", "/favicon.ico",
                    "/static/**", "/*.js", "/*.css", "/*.map",
                    "/callback", "/callback/**",
                    "/dashboard", "/kanban", "/kpi", "/profile",
                    "/auth/sign-in", "/auth/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable())
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(jwtDecoder()))
            );
        return http.build();
    }
}