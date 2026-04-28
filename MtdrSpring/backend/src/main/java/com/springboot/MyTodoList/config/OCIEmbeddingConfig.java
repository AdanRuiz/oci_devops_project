package com.springboot.MyTodoList.config;

import com.oracle.bmc.Region;
import com.oracle.bmc.auth.BasicAuthenticationDetailsProvider;
import com.oracle.bmc.auth.ConfigFileAuthenticationDetailsProvider;
import com.oracle.bmc.auth.InstancePrincipalsAuthenticationDetailsProvider;
import com.oracle.bmc.generativeaiinference.GenerativeAiInferenceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class OCIEmbeddingConfig {

    private static final Logger LOG = LoggerFactory.getLogger(OCIEmbeddingConfig.class);

    @Value("${oci.auth.mode:CONFIG_FILE}")
    private String authMode;

    @Value("${oci.auth.profile:DEFAULT}")
    private String authProfile;

    @Value("${oci.genai.region:us-chicago-1}")
    private String regionId;

    @Bean
    public GenerativeAiInferenceClient generativeAiInferenceClient() throws IOException {
        BasicAuthenticationDetailsProvider provider;
        if ("INSTANCE_PRINCIPAL".equalsIgnoreCase(authMode)) {
            LOG.info("OCI auth: Instance Principals");
            provider = InstancePrincipalsAuthenticationDetailsProvider.builder().build();
        } else {
            LOG.info("OCI auth: ConfigFile profile={}", authProfile);
            provider = new ConfigFileAuthenticationDetailsProvider(authProfile);
        }
        GenerativeAiInferenceClient client = GenerativeAiInferenceClient.builder()
                .region(Region.fromRegionId(regionId))
                .build(provider);
        return client;
    }
}
