package com.springboot.MyTodoList.service.embedding;

import com.oracle.bmc.generativeaiinference.GenerativeAiInferenceClient;
import com.oracle.bmc.generativeaiinference.model.EmbedTextDetails;
import com.oracle.bmc.generativeaiinference.model.OnDemandServingMode;
import com.oracle.bmc.generativeaiinference.requests.EmbedTextRequest;
import com.oracle.bmc.generativeaiinference.responses.EmbedTextResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class OCIEmbeddingService {

    private static final Logger LOG = LoggerFactory.getLogger(OCIEmbeddingService.class);
    private static final int MAX_BATCH = 96;

    private final GenerativeAiInferenceClient client;
    private final String compartmentId;
    private final String modelId;

    public OCIEmbeddingService(GenerativeAiInferenceClient client,
                               @Value("${oci.genai.compartment-ocid}") String compartmentId,
                               @Value("${oci.genai.embedding-model:cohere.embed-multilingual-v3.0}") String modelId) {
        this.client = client;
        this.compartmentId = compartmentId;
        this.modelId = modelId;
    }

    public float[] embed(String text) {
        List<float[]> out = embedBatch(Collections.singletonList(text));
        return out.get(0);
    }

    public List<float[]> embedBatch(List<String> texts) {
        List<float[]> result = new ArrayList<>(texts.size());
        for (int i = 0; i < texts.size(); i += MAX_BATCH) {
            int end = Math.min(i + MAX_BATCH, texts.size());
            List<String> chunk = texts.subList(i, end);
            result.addAll(callEmbed(chunk));
        }
        return result;
    }

    private List<float[]> callEmbed(List<String> inputs) {
        EmbedTextDetails details = EmbedTextDetails.builder()
                .compartmentId(compartmentId)
                .servingMode(OnDemandServingMode.builder().modelId(modelId).build())
                .inputs(inputs)
                .truncate(EmbedTextDetails.Truncate.End)
                .build();

        EmbedTextRequest req = EmbedTextRequest.builder()
                .embedTextDetails(details)
                .build();

        EmbedTextResponse resp = client.embedText(req);
        List<List<Float>> raw = resp.getEmbedTextResult().getEmbeddings();

        List<float[]> out = new ArrayList<>(raw.size());
        for (List<Float> v : raw) {
            float[] arr = new float[v.size()];
            for (int j = 0; j < v.size(); j++) arr[j] = v.get(j);
            out.add(arr);
        }
        if (LOG.isDebugEnabled()) {
            LOG.debug("Embedded {} inputs ({} dims)", out.size(), out.isEmpty() ? 0 : out.get(0).length);
        }
        return out;
    }
}
