package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.util.Timeout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeepSeekService {

    private static final Logger LOG = LoggerFactory.getLogger(DeepSeekService.class);

    private final CloseableHttpClient httpClient;
    private final String apiUrl;
    private final String apiKey;
    private final String model;
    private final int timeoutMs;
    private final ObjectMapper mapper = new ObjectMapper();

    public DeepSeekService(CloseableHttpClient httpClient,
                           @Value("${deepseek.api.url}") String apiUrl,
                           @Value("${deepseek.api.key}") String apiKey,
                           @Value("${deepseek.api.model:deepseek-chat}") String model,
                           @Value("${deepseek.api.timeout-ms:30000}") int timeoutMs) {
        this.httpClient = httpClient;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.model = model;
        this.timeoutMs = timeoutMs;
    }

    public String generateText(String prompt) throws IOException {
        Map<String, String> userMsg = new LinkedHashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", prompt);
        return chat(Collections.singletonList(userMsg));
    }

    public String chat(String systemPrompt, String userPrompt) throws IOException {
        List<Map<String, String>> msgs = new ArrayList<>(2);
        if (systemPrompt != null && !systemPrompt.isEmpty()) {
            Map<String, String> s = new LinkedHashMap<>();
            s.put("role", "system");
            s.put("content", systemPrompt);
            msgs.add(s);
        }
        Map<String, String> u = new LinkedHashMap<>();
        u.put("role", "user");
        u.put("content", userPrompt);
        msgs.add(u);
        return chat(msgs);
    }

    public String chat(List<Map<String, String>> messages) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", messages);

        String json = mapper.writeValueAsString(body);

        HttpPost post = new HttpPost(apiUrl);
        post.addHeader("Authorization", "Bearer " + apiKey);
        post.setEntity(new StringEntity(json, ContentType.APPLICATION_JSON));
        post.setConfig(RequestConfig.custom()
                .setResponseTimeout(Timeout.ofMilliseconds(timeoutMs))
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(timeoutMs))
                .build());

        try (CloseableHttpResponse resp = httpClient.execute(post)) {
            int status = resp.getCode();
            String respBody = EntityUtils.toString(resp.getEntity());
            if (status < 200 || status >= 300) {
                LOG.warn("DeepSeek HTTP {}: {}", status, truncate(respBody));
                throw new IOException("DeepSeek error " + status + ": " + truncate(respBody));
            }
            JsonNode root = mapper.readTree(respBody);
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new IOException("DeepSeek response missing choices: " + truncate(respBody));
            }
            JsonNode content = choices.get(0).path("message").path("content");
            if (content.isMissingNode() || content.isNull()) {
                throw new IOException("DeepSeek response missing content: " + truncate(respBody));
            }
            return content.asText();
        } catch (org.apache.hc.core5.http.ParseException e) {
            throw new IOException("Could not read DeepSeek response", e);
        }
    }

    private static String truncate(String s) {
        if (s == null) return "";
        return s.length() <= 500 ? s : s.substring(0, 500) + "…";
    }
}
