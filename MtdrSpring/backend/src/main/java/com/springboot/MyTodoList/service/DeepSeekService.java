package com.springboot.MyTodoList.service;

import java.io.IOException;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.stereotype.Service;

@Service
public class DeepSeekService{
    private final CloseableHttpClient httpClient;
    private final HttpPost httpPost;

    public DeepSeekService(CloseableHttpClient httpClient, HttpPost httpPost) {
        this.httpClient = httpClient;
        this.httpPost = httpPost;
    }

    public String generateText(String prompt) throws IOException, org.apache.hc.core5.http.ParseException {
        String requestBody = String.format("{\"model\": \"deepseek-chat\",\"messages\": [{\"role\": \"user\", \"content\": \"%s\"}]}", prompt);
        httpPost.setEntity(new StringEntity(requestBody));
        CloseableHttpResponse response = httpClient.execute(httpPost);
        return EntityUtils.toString(response.getEntity());
    }
}
